#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

//  Verifica se um único número é primo (usado na recursão)
bool primo(int n, int i) {
    if (n <= 1){
        return false;
    }
    if (n == 2){
        return true;
    } 
    if (n % i == 0){
        return false;
    } 
    if (i * i > n){
        return true;
    } 
    return primo(n, i + 1);
}

//  FUNÇÃO RECURSIVA
void primos_recursivo(int atual, int n) {
    if (atual > n){
        return;
    } 
    
    if (primo(atual, 2)) {
        printf("%d ", atual);
    }
    primos_recursivo(atual + 1, n);
}

// FUNÇÃO LINEAR (Crivo de Eratóstenes)
void primos_linear(int n) {
    // Aloca memória (True = Primo, False = Composto)
    bool *primo = malloc((n + 1) * sizeof(bool));
    
    // Inicializa todos como verdadeiros
    for (int i = 0; i <= n; i++) {
        primo[i] = true;
    }
    
    // 0 e 1 não são primos
    primo[0] = false;
    primo[1] = false;
    
   
    for (int p = 2; p * p <= n; p++) {
        if (primo[p] == true) {
            
            for (int i = p * p; i <= n; i += p) {
                primo[i] = false;
            }
        }
    }
    
    // Imprime o resultado
    for (int p = 2; p <= n; p++) {
        if (primo[p]) {
            printf("%d ", p);
        }
    }
    
    free(primo); 
}

int main() {
    int n;
    
    printf("Digite um numero N (N > 1): ");
    scanf("%d", &n);
    
    // --- VALIDAÇÃO DO INPUT ---
    if (n <= 1) {
        n = abs(n);
        printf("\n Resultado Recursivo \n");
        primos_recursivo(2, n);
        printf("\n");
        
        printf("\n Resultado Linear (Crivo) \n");
        primos_linear(n);
        printf("\n");
        return 1;
    }
    
    printf("\n--- Resultado Recursivo ---\n");
    primos_recursivo(2, n);
    printf("\n");
    
    printf("\n--- Resultado Linear (Crivo) ---\n");
    primos_linear(n);
    printf("\n");
    
    return 0;
}
