// Aula 2 - JavaScript
alert("Seja Bem vindo")

// Alterando o valor de um input
document.getElementById("test").value = "Oi, tudo bem?";

// temos duas formas de comentar um codigo em JavaScript
// 1. Comentario de uma linha
/* 2. Comentario de multiplas linhas
   Podemos escrever varias linhas aqui
   e o JavaScript vai ignorar tudo isso
*/

// Exemplo de variaveis
/* temos 3 tipos de variaveis em JavaScript:
    1. var - escopo global, pode ser alterada em qualquer parte do codigo
    2. let - escopo local, pode ser alterada apenas dentro do bloco onde foi declarada
    3. const - constante, nao pode ser alterada depois de declarada

    Podendo ser: string, number, boolean, object, array, function, etc.
 */  

var nome = "Ducher Seidi"; // tipo string (var ou let)

let idade = 25; // tipo number (let ou var)
// podemos usar const para variaveis que nao vao mudar
const cidade = "Sao Paulo"; // tipo string (const)
const ativo = true; // tipo boolean (const)

// Exibindo os valores no console
document.write("Nome: " + nome + "<br>");
document.write(idade + "<br>");

// Exibindo os valores no console, e usando concatenacao
console.log("Cidade: " + cidade);
console.log("Nome:" + nome);
console.log("Idade: " + idade);

// Lendo o valor de uma variavel de um usuario
let nomeUsuario = prompt("Digite seu nome: ");
document.write("Nome do usuario: " + nomeUsuario + "<br>");

// null é ausencia de valor, undefined é quando a variavel nao foi declarada
var nulo = null; // tipo null
var indefinido; // tipo undefined
var teste2 = undefined; // tipo undefined

// Alterando o valor de uma variavel
nome =  "Ducher Seidi Alterado"; // alterando o valor da variavel nome
document.write("Nome alterado: " + nome + "<br>");
