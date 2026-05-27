# Internship Project

## Установка зависимостей

```bash
npm install
```
## Нужно установить:
express
jsonwebtoken
dotenv
jest

## Запуск проекта

```bash
npm start
```

## Запуск тестов

```bash
npm test
```

## Для того, чтобы узнать, токен достаточно выполнить команду в папке проекта, когда он не запущен
```
node -e "const jwt=require('jsonwebtoken'); const cfg=require('./src/config'); console.log(jwt.sign({}, cfg.authToken, {expiresIn:'1h'}));"
```

## Добавление тикера в базу, выполняется во втором окне командной строки, при запущеном проекте
```
curl -X POST http://localhost:3000/currencies -H "Content-Type: application/json" -H "Authorization: Bearer <ТВОЙ_TOKEN>" -d "{\"name\":\"Bitcoin\",\"ticker\":\"BTC\"}"
```
## Посмотреть курсы из Binance, выполняется во втором окне командной строки, при запущеном проекте
```
curl -X GET "http://localhost:3000/price?currency=BTC" -H "Authorization: Bearer <ТВОЙ_TOKEN>"
```
