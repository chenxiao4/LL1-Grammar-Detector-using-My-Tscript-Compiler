
//--------------------------- Global Variables -----------------------------------------------
var Productions = [];
var Terminals = [];
var nonTerminals = [];
var NullDerivingNonterminals = [];
var debug = false;
//--------------------------------------------------------------------------------------------


//--------------------------------------- helper functions -----------------------------------
//production object
Production = function(lhs,rhs){
	this.lhs = lhs; //lhs is a string
	this.rhs = rhs; //rhs is an array of strings
	this.Predict = []; //predict set for a production

	return this;
};


//symbol object, wrapper object  of a str
Symbol = function(str,isNonTerminal,isNullDerive){

	this.str = str;
	this.isNonTerminal = isNonTerminal;
	this.isNullD = isNullDerive;
	this.First = []; //store str not Symbol
	this.Follow = [];
	//this.Predict = [];
	this.Products = [];//store the productions

	return this;
};



//contains method, e.g if a Symbol with str is in an array of Symbols 
contains = function(array,str){

	var i = 0;
	while(i < array.length){

		if(array.get(i).str == str)
			return true;
		i = i + 1;
	}

	return false;
};



//read productions from stdin
readProduction = function() {

	var x,p,sym;

	while(true){
		x = readln();
		if(!x)
			break;
		else {
			var tmp = split(trim(x)," ");
			if (tmp.length == 1){
				p = new Production(tmp.get(0),undefined);
				sym = new Symbol(tmp.get(0),true,true);
			}else{
				p = new Production(tmp.get(0),tmp.slice(1));
				sym = new Symbol(tmp.get(0),true,undefined);
			}
			Productions.push(p);

			if(!contains(nonTerminals,sym.str)){
				sym.Products.push(p);
				nonTerminals.push(sym);
			}else{
				getSymbol(sym.str).Products.push(p);
				if(sym.isNullD)
					getSymbol(sym.str).isNullD = true;
			}
		}
	}

	nonTerminals.get(0).Follow.push("EOF");
};



//get terminals
getTerminal = function(){

	var i = 0;
	while(i < Productions.length){
		var tmp = Productions.get(i);
		if(!(tmp.rhs == undefined)){
			var j = 0;
			while(j < tmp.rhs.length){
				var sym = new Symbol(tmp.rhs.get(j),false,false);
				if (!contains(nonTerminals,sym.str))
					if(!contains(Terminals,sym.str))
						Terminals.push(sym);
				j = j + 1;
			}
		}
		i = i + 1;
	}
};


//get the symbol object of the str
getSymbol = function(str){

	var i = 0;
	while(i < nonTerminals.length){
		if(nonTerminals.get(i).str == str)
			return nonTerminals.get(i);
		i = i + 1;
	}

	i = 0;
	while(i < Terminals.length){
		if(Terminals.get(i).str == str)
			return Terminals.get(i);
		i = i + 1;
	}

	print "In getSymbol: Cannot find the symbol!";
	return undefined;
};



//find the null derived nonterminal
getNullDerivedNonTerminal = function(nonterminal){

	var sym = nonterminal;
	var j = 0;

	while(j < sym.Products.length){
		var production = sym.Products.get(j);
		var rhs = production.rhs;

		if(sym.isNullD)
			return true;
		else {
			if(rhs == undefined){
				sym.isNullD = true;
				return true;
			} else {
				var k = 0;
				var isequal = false;

				while(k < rhs.length){
					var psym = getSymbol(rhs.get(k));
					if(psym.isNonTerminal){
						if(sym.str == psym.str){
							isequal = true;
							k = k + 1;
							continue;
						}
						var flag;
						if(psym.isNullD == undefined){
							flag = getNullDerivedNonTerminal(psym,sym);
						} else
							flag = psym.isNullD;

						if(!flag){
							sym.isNullD = false;
							break;
						}
					} else{
						sym.isNullD = false;
						break;
					}

					k = k + 1;
				}
				if(k == rhs.length){
					if(!isequal){
						sym.isNullD = true;
						return true;
					}
				}
			}
		}

		j = j + 1;
	}

	sym.isNullD = false;
	return false;

};




//get the null derived nonterminal
getNullDerivedNonTerminals = function(){

	var i = 0;
	while(i < nonTerminals.length){
		var tmp = nonTerminals.get(i);

		if(tmp.isNullD == undefined)
			getNullDerivedNonTerminal(tmp);

		if(tmp.isNullD){
			var sym = new Symbol(tmp.str,true,true);
			NullDerivingNonterminals.push(sym);
		}
		i = i + 1;
	}
};



//is production null derived
isProductionNullDerived = function(production){

	var i = 0;
	var rhs = production.rhs;

	if(rhs == undefined)
		return true;

	while(i < rhs.length){
		var str = rhs.get(i);
		var sym = getSymbol(str);
		if(sym.isNonTerminal){
			if(!sym.isNullD)
				return false;
		} else
			return false;

		i = i + 1;
	}

	return true;
};



//add one right set to left set
addToSet = function(left,right){
	var i = 0;
	var ret = false;
	
	while(i < right.length){
		var str = right.get(i);
		if(!left.contains(str)){
			left.push(str);
			ret = true;
		}
		i = i + 1;
	}	
	//return false if right is a subset of left
	return ret;
};



//get GFirst of a production, recursive version. can not handle loop in grammar
getGFirst = function(production){

	var i = 0;
	var ret = [];
	var rhs = production.rhs;

	while(i < rhs.length){

		var str = rhs.get(i);
		var sym = getSymbol(str);

		if(!sym.isNonTerminal){

			if(!ret.contains(str))
				ret.push(str);
			break;

		} else {

			if(production.lhs == str)
				addToSet(ret,sym.First);
			else 
				addToSet(ret,getFirst(sym));

			if(!sym.isNullD)
				break;
		}

		i = i + 1;
	}

	return ret;
};


//non-recursice version. Robust
getGFirstNonRecursive = function(production){

	var i = 0;
	var ret = [];
	var rhs = production.rhs;

	while(i < rhs.length){

		var str = rhs.get(i);
		var sym = getSymbol(str);

		if(!sym.isNonTerminal){

			if(!ret.contains(str))
				ret.push(str);
			break;

		} else {
			addToSet(ret,sym.First);
			if(!sym.isNullD)
				break;
		}

		i = i + 1;
	}


	return ret;
};




//get First of a nonterminal. Recursive version, can not handle loop in grammar
getFirst = function(nonterminal){

	var i = 0;
	var res = [];

	while(i < nonterminal.Products.length){

		var production = nonterminal.Products.get(i);
		if(production.rhs == undefined){
			i = i + 1;
			continue;
		}

		var gfirst = getGFirst(production);
		addToSet(nonterminal.First,gfirst);
		addToSet(res,gfirst);
		i = i + 1;
	}

	return res;
};


//non-recursive version. Robust
getFirstNonRecursive = function(){
	
	while(true){
		var cter = 0;
		var i = 0;
		while(i < nonTerminals.length){
			var j = 0;
			var nonterminal = nonTerminals.get(i);
			var products = nonterminal.Products;
			
			while(j < products.length){
				
				var production = products.get(j);
				var rhs = production.rhs;
				
				if(rhs == undefined){
					j = j + 1;
					continue;
				}
				
				var k = 0;
				
				while(k < rhs.length){
					
					var sym = getSymbol(rhs.get(k));
	
					if(sym.isNonTerminal){
						
						var flag = addToSet(nonterminal.First,sym.First);
						if(flag)
							cter = cter + 1;
						if(!sym.isNullD)
							break;
					} else {
						var flag = addToSet(nonterminal.First,[sym.str]);
						if(flag)
							cter = cter + 1;
						break;
					}
					
					k = k + 1;
				}
				
				j = j + 1;
			}
			i = i + 1;
		}
		
		if(cter == 0)
			break;
	}
	
	
};


//First sets of all nonterminals
getAllFirstRecursive = function(){

	var i = 0;

	while(i < nonTerminals.length){

		var sym = nonTerminals.get(i);
		addToSet(sym.First,getFirst(sym));
		i = i + 1;
	}

};


//wrapper function
getAllFirstNonRecursive = function(){

	getFirstNonRecursive();
	
};




//get follow set
getFollow = function(nonterminal){

	updateFollowProduction = function(production){

		var i = 0;
		var lsym = getSymbol(production.lhs);
		var rhs = production.rhs;
		var plen = rhs.length;
		var flag = false;//used to indicate if need to update

		if(plen == 1){
			var str = rhs.get(0);
			var tmp = getSymbol(str);
			if(tmp.isNonTerminal){
				//addToSet(tmp.Follow,lsym.Follow);
				if(addToSet(tmp.Follow,lsym.Follow))
					flag = true;
			}

		} else {

			while(i < (plen - 1)){
				var tmps = rhs.get(i);
				var tsym = getSymbol(tmps);
				if(tsym.isNonTerminal){
					var tmpa = rhs.slice(i+1);
					var tmpp = new Production(undefined,tmpa);
					//addToSet(tsym.Follow,getGFirst(tmpp));
					//addToSet(tsym.Follow,getGFirstNonRecursive(tmpp));
					if(addToSet(tsym.Follow,getGFirstNonRecursive(tmpp)))
						flag = true;
					
					if(isProductionNullDerived(tmpp)){
						//addToSet(tsym.Follow,lsym.Follow);
						if(addToSet(tsym.Follow,lsym.Follow))
							flag = true;
					}
				}

				i = i + 1;
			}//while

			var last = getSymbol(rhs.get(plen-1));
			if(last.isNonTerminal){
				//addToSet(last.Follow,lsym.Follow);
				if(addToSet(last.Follow,lsym.Follow))
					flag = true;
			}

		}// end else
		
		return flag;
	};//inner function

	var j = 0;
	var ret = false;

	while(j < nonterminal.Products.length){

		var tmp = nonterminal.Products.get(j);

		if(tmp.rhs == undefined){
			j = j + 1;
			continue;
		}
		
		//updateFollowProduction(tmp);
		if(updateFollowProduction(tmp))
			ret = true;
		
		j = j + 1;
	}

	return ret;
};


//get all follow
getAllFollow = function(){

	while(true){
		var cter = 0;
		var i = 0;
		
		while(i < nonTerminals.length){
			var sym = nonTerminals.get(i);
			//getFollow(sym);
			if(getFollow(sym))
				cter = cter + 1;
			i = i + 1;
		}
		if(cter == 0)
			break;
	}
};


getPredict = function(production){

	var rhs = production.rhs;
	var sym = getSymbol(production.lhs);

	if(rhs == undefined)
		addToSet(production.Predict,sym.Follow);
	else {
		if(isProductionNullDerived(production))
			addToSet(production.Predict,sym.Follow);

		//addToSet(production.Predict,getGFirst(production));
		addToSet(production.Predict,getGFirstNonRecursive(production));
	}

};


//get all predict sets
getAllPredict = function(){
	var i = 0;

	while(i < nonTerminals.length){
		var sym = nonTerminals.get(i);
		var j = 0;

		while(j < sym.Products.length){
			getPredict(sym.Products.get(j));
			j = j + 1;
		}
		i = i + 1;
	}
};



//is LL1 grammar
isLL1 = function(){

	var i = 0;

	while(i < nonTerminals.length){
		var sym = nonTerminals.get(i);

		if(sym.Products.length > 1){
			var j = 0;
			var tmp = [];

			while(j < sym.Products.length){
				var production = sym.Products.get(j);
				var k = 0;

				while(k < production.Predict.length){
					var str = production.Predict.get(k);
					if(tmp.contains(str))
						return false;
					else
						tmp.push(str);
					k = k + 1;
				}
				j = j + 1;
			}
		}

		i = i + 1;
	}

	return true;
};
//--------------------------------------------------------------------------------------------------------


//------------------------------------- print functions --------------------------------------------------
//print the productions
printProductions = function(Productions,noprintpred){
	var i = 0;
	while(i < Productions.length){
		if(Productions.get(i).rhs == undefined){
			print " 	" + Productions.get(i).lhs + " -----> ";
		} else {
			print " 	" + Productions.get(i).lhs + " -----> " + Productions.get(i).rhs;
		}
		if(!noprintpred)
			print "			" + "Predict: " + Productions.get(i).Predict;
		i = i + 1;
	}
};


//print terminal and nonterminals
printSymbols = function(ss){
	var i = 0, ret;
	ret = "[";

	if(ss.length > 1){
		while(i < ss.length-1){
			ret = ret + ss.get(i).str + ", ";
			i = i + 1;
		}
		ret = ret + ss.get(ss.length-1).str + "]";
	} else
		ret = ret + "]";
	
	print ret;
};



//print a single symbol content
printSymbolContent = function(ss){

	print "--------------------------------------";
	print "- Symbol: " + ss.str;
	print "- isNonTerminal: " + ss.isNonTerminal;
	print "- isNullDerived: " + ss.isNullD;
	print "- First Set: " + ss.First;
	print "- Follow Set: " + ss.Follow;
	print "- Productions: ";
	printProductions(ss.Products);
	print "--------------------------------------";


};



//print symbols detail
printSymbolsContent = function(ss){
	var i = 0;
	while(i < ss.length){		
		printSymbolContent(ss.get(i));
		i = i + 1;
	}

};



//print strings of symbols
printSymbolsStr = function(symbols){

	var i = 0, tstr = "";
	while(i < symbols.length){
		tstr = tstr + symbols.get(i).str + " ";
		i = i + 1;
	}
	print tstr;	

};


//print a set
SetToString = function(set){

	var i = 0;
	var tstr = "";

	while(i < set.length){

		tstr = tstr + set.get(i) + " ";
		i = i + 1;
	}

	return tstr;
};



//print sets
printFFPsets = function(hint){
	//0: first, 1: follow, 2: predict

	var tstr = "";

	if(hint == 2){
		var i = 0;
		while(i < nonTerminals.length){

			var j = 0;
			var sym = nonTerminals.get(i);

			while(j < sym.Products.length){
				var production = sym.Products.get(j);
				//var k = 0;

				tstr = tstr + production.lhs + " ------> ";
				if (!(production.rhs == undefined))
					tstr = tstr + SetToString(production.rhs) + "\n";
				else
					tstr = tstr + "\n";

				tstr = tstr + SetToString(production.Predict) + "\n\n";	
				j = j + 1;
			}

			i = i + 1;
		}

	} else {


		var i = 0;
		while(i < nonTerminals.length){
			var sym = nonTerminals.get(i);
			if(hint == 0)
				tstr = tstr + sym.str + ": " + SetToString(sym.First) + "\n";
			else
				tstr = tstr + sym.str + ": " + SetToString(sym.Follow) + "\n";
			i = i + 1;
		}	
	}

	print tstr;
};






//report result
reportResult = function(){

	print "Start Symbol\n";
	print nonTerminals.get(0).str;
	print "";

	print "Nonterminals\n";
	printSymbolsStr(nonTerminals);
	print "";

	print "Terminals\n";
	printSymbolsStr(Terminals);
	print "";

	print "Null-Deriving Nonterminals\n";
	printSymbolsStr(NullDerivingNonterminals);
	print "";

	print "First Sets\n";
	printFFPsets(0);
	print "";

	print "Follow Sets\n";
	printFFPsets(1);
	print "";

	print "Predict Sets\n";
	printFFPsets(2);

	if(isLL1())
		print "The grammar is LL(1).";
	else
		print "The grammar is NOT LL(1).";
	print "";

};
//---------------------------------------------------------------------------------------------------------





//--------------------------------------------- output section --------------------------------------------

if(!debug){
	readProduction();
	getTerminal();
	getNullDerivedNonTerminals();
	//getAllFirstRecursive();
	getAllFirstNonRecursive();
	getAllFollow(); 
	getAllPredict();
	reportResult();
}

//-----------------------------------------------------------------------------------------------------------



//-------------------------------------------- used for debug, print details of a Symbol object -------------
if(debug){

	readProduction();

	printProductions(Productions,true);
	//printSymbolsContent(nonTerminals);

	getTerminal();
	getNullDerivedNonTerminals();
	getAllFirstNonRecursive();
	getAllFollow(); 
	getAllPredict();
	//getAllFirstRecursive();
	
	print "";
	print "";
	print "nonTerminals: ";
	printSymbols(nonTerminals);
	//printSymbolsContent(nonTerminals);
	print "Terminals: ";
	printSymbols(Terminals);
	print "NullDerived nonTerminals: ";
	printSymbols(NullDerivingNonterminals);
	printSymbolsContent(nonTerminals);
	print "isLL1?: " + isLL1();

}
//------------------------------------------------------------------------------------------------------------






