# StockSense

StockSense is a browser-based inventory dashboard built with HTML, CSS, and JavaScript modules.

The current demo stores its data in the browser's local storage. Supabase authentication and database access are not connected yet.

## Features

- Dashboard cards for total stock, low stock, pending receipts, deliveries, and transfers
- Stock availability by product, warehouse, and location
- Operation filters for type, status, warehouse, and category
- Product catalog with product search and category filtering
- Receipt, delivery, transfer, and adjustment pages
- Stock movement ledger
- Sign-in, sign-up, and password-reset screens

## Run the app

Open a terminal in the `stocksense` project folder and start a local web server:

```sh
python3 -m http.server 8000