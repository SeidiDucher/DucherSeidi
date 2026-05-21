#include <stdio.h>
#include <stdlib.h>

// Função recursiva para calcular n número de Fibonacci
int fibonacciRecursiva(int f){
    if(f < 0){
        return -1; //indica um valor inválido
    } 
    else if (f == 0){
        return 0;
    } 
    else if (f == 1){
        return 1;
    } 
    else {
        return fibonacciRecursiva(f-1) + fibonacciRecursiva(f-2);
    }
}

// Função linear para calcular n número de Fibonacci
int fibonacciLinear(int f){
    if(f < 0){
        return -1; //indica um valor inválido
    } 
    else if (f == 0){
        return 0;
    } 
    else if (f == 1){
        return 1; 
    } 
    else {
        int d = 0;
        int u = 1;
        int c;
        for(int i = 2; i <= f; i++){
            c = d + u;
            d = u;
            u = c;
        }
        return u;
    }
}

// Função principal para testar as funções de Fibonacci
int main() {
    int fib; 
    int pos;
    printf("Digite um numero maior ou igual zero para calcular o Fibonacci: ");
    scanf("%d", &fib);

    if(fib < 0){
       pos = abs(fib);
       printf("Fibonacci recursivo: %d\n", fibonacciRecursiva(pos));
       printf("Fibonacci linear: %d\n", fibonacciLinear(pos));
       return 1;
    }

    printf("Fibonacci recursivo: %d\n", fibonacciRecursiva(fib));
    printf("Fibonacci linear: %d\n", fibonacciLinear(fib));

    return 0;
}
