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
better-sqlite3

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
## Посмотреть все валюты из базы данных
```
curl http://localhost:3000/currencies -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Обновить запись в базе данных
```
curl -X PUT http://localhost:3000/currencies/3 -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_JWT_TOKEN" -d "{\"name\":\"new Name\", \"ticker\":\"new Ticker\"}"
```

## Удалить запись из базы данных используя id
```
curl -X DELETE http://localhost:3000/currencies/2 -H "Authorization: Bearer YOUR_JWT_TOKEN"
```
