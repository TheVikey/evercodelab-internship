# Internship Project

## Установка зависимостей

```bash
npm install
```

## Инициализация базы данных
```
npm run db-init
```

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

# Управление валютами

## Создать валюту
```
curl.exe -X POST http://localhost:3000/currencies -H "Content-Type: application/json" -H "Authorization: Bearer <TOKEN>" -d "{\"name\":\"Bitcoin\",\"ticker\":\"BTC\"}"
```

## Создать ещё одну
```
curl.exe -X POST http://localhost:3000/currencies -H "Content-Type: application/json" -H "Authorization: Bearer <TOKEN>" -d "{\"name\":\"Ethereum\",\"ticker\":\"ETH\"}"
```

## Получить все
```
curl.exe http://localhost:3000/currencies -H "Authorization: Bearer <TOKEN>"
```

## Получить по ID
```
curl.exe http://localhost:3000/currencies/1 -H "Authorization: Bearer <TOKEN>"
```

## Обновить
```
curl.exe -X PUT http://localhost:3000/currencies/1 -H "Content-Type: application/json" -H "Authorization: Bearer <TOKEN>" -d "{\"name\":\"Bitcoin Updated\"}"
```

## Удалить
```
curl.exe -X DELETE http://localhost:3000/currencies/2 -H "Authorization: Bearer <TOKEN>"
```

## Актуальные цены (из БД, обновляются фоновой задачей каждую минуту)
```
curl.exe "http://localhost:3000/price?currency=BTC" -H "Authorization: Bearer <TOKEN>"
```

## История цен
```
curl.exe "http://localhost:3000/price/BTC/history?interval=1h&limit=10" -H "Authorization: Bearer <TOKEN>"
```

## Управление адресами

## Создание адреса
```
curl.exe -X POST http://localhost:3000/wallets -H "Content-Type: application/json" -H "Authorization: Bearer <TOKEN>" -d "{\"address\":\"0x8894E0a0c962CB723c1ef8580d0543D766927E2b\",\"blockchain\":\"bsc\",\"label\":\"My Wallet\"}"
```

## Получить все (из БД, обновляются фоновой задачей)
```
curl.exe http://localhost:3000/wallets -H "Authorization: Bearer <TOKEN>"
```

## Получить по ID
```
curl.exe http://localhost:3000/wallets/1 -H "Authorization: Bearer <TOKEN>"
```

## Обновить
```
curl.exe -X PUT http://localhost:3000/wallets/1 -H "Content-Type: application/json" -H "Authorization: Bearer <TOKEN>" -d "{\"label\":\"Updated Wallet\"}"
```

## Удалить
```
curl.exe -X DELETE http://localhost:3000/wallets/1 -H "Authorization: Bearer <TOKEN>"
```

## Проект поодерживает обновление курсов и истории цен, которые есть на Binance, высоту блокчейна можно посмотреть только для BSC