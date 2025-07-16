
var a = 10;
var b = 20;
var c = null;

document.write("Valor inicial de A: "+ a + "<br>");
document.write("Valor inicial de B: "+ b + "<br>");
document.write("Valor inicial de C: "+ c + "<br>");

var c = a;
var a = b;
var b = c; 

document.write("Valor final de A: "+ a + "<br>");
document.write("Valor final de B: "+ b + "<br>");
document.write("Valor final de C: "+ c + "<br>");