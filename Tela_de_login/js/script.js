const form = document.getElementById("formulario")
form.addEventListener("submit", (event)=>{
    event.preventDefault()
    const nome = document.getElementById("nome").value.trim() // trim para Remover espaços em branco
    const senha = document.getElementById("senha").value.trim()
    const error = document.getElementById("erro_info")

    if(nome === "" || senha ===""){
        error.textContent = "Prencha todos os campos"
        error.style.color= "blue"
    }
    else if(nome == "admin" && senha == "1234"){
        error.textContent = "Logado com sucesso"
        error.style.color= "green"
    }
    else{
        error.textContent = "Usuário ou senha inválidos"
        error.style.color= "red"
    }
   
})