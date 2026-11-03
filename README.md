# Digital PDF Store - Frontend Only Demo

## Features
- Professional responsive homepage with product listings, search, and category filters
- Individual product details pages
- Pakistani Rupee pricing
- Admin dashboard (frontend only, demo) - add/edit/delete products, PDF upload interface
- Shopping cart with quantity controls
- Checkout page with customer form
- Payment gateway integration interface/design (not configured)
- Order confirmation and order management interface
- Admin login interface (frontend only, not secure for production)
- PDF download interface (demo)
- WhatsApp order/contact button
- Portfolio-quality styling and navigation

## Important Limitations (Frontend Only)
- **No database**: Products, cart, orders, and uploads are stored only in your browser's localStorage/memory for this demo session.
- **Not persistent across devices**: Data resets when clearing browser storage or in different browsers/devices.
- **Not secure**: Frontend-only admin login is not secure. Do not use real admin credentials or sensitive data.
- **Payments not processed**: The payment page is an integration-ready UI only. No real payments are processed. Do not enter real card details.
- **PDF uploads**: Files selected for upload are not sent to a server/storage in this demo mode and may not be securely shared.
- **No central storage**: Orders and customer details submitted in the demo may not be saved centrally.

## Local Setup
1. Install dependencies: `npm install`
2. Run development server: `npm run dev`
3. Open [http://localhost:3000](http://localhost:3000)
4. Optional: copy `.env.example` to `.env.local` if needed for WhatsApp number

## Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
