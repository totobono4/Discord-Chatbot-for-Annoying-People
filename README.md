# Discord-Chatbot-for-Annoying-People

## Installez node et ollama :
 - https://nodejs.org/en/download &emsp; *v20.10.0 recommandé*
 - https://ollama.com/download &emsp; &emsp;*v0.3.10 recommandé*

### Lancez une console :
 - installez un model ex: `ollama pull wizard-vicuna-uncensored:13b`
 - Faite un npm i
 - Puis faite un npm start pour lancer le programe

## Créez le .env
 - Pour start automatiquement sans rentrer l'email et/ou le password
```.env
DISCORD_EMAIL=votreEmail
DISCORD_PASSWORD=votrePassword
```
 - Pour changer le model
```.env
OLLAMA_MODEL=leModel
```
