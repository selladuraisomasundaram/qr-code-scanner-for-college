# AI Development Rules & Tech Stack

## Tech Stack
*   **Framework**: Next.js 13 (Pages Router) for both frontend and API routes.
*   **Styling**: Tailwind CSS for utility-first responsive design.
*   **QR Generation**: `react-qr-code` for rendering SVG-based QR codes.
*   **QR Scanning**: `react-qr-reader` (v3 beta) for camera-based scanning.
*   **Data Integration**: Google Sheets API via `googleapis` for persistent storage.
*   **HTTP Client**: `axios` for client-side requests to internal API routes.
*   **Language**: JavaScript (ES6+) with standard Next.js configurations.

## Development Rules

### 1. Component & Page Structure
*   Always use the **Pages Router** (`src/pages/`) as per the existing architecture.
*   Keep components small and focused. If a component exceeds 100 lines, refactor it into smaller sub-components in `src/components/`.
*   Use functional components with hooks.

### 2. Styling Guidelines
*   Use **Tailwind CSS** exclusively for all styling. Avoid inline styles or CSS modules unless absolutely necessary.
*   Ensure all designs are mobile-responsive using Tailwind's responsive modifiers (e.g., `md:`, `lg:`).

### 3. QR Functionality
*   For **Generating QR Codes**: Use the `QRCode` component from `react-qr-code`.
*   For **Scanning QR Codes**: Use the `QrReader` component from `react-qr-reader`. Always handle camera permissions and errors gracefully.

### 4. API & Data Handling
*   All external integrations (like Google Sheets) must be handled in **Server-Side API Routes** (`src/pages/api/`).
*   Use `axios` for all frontend-to-backend communication.
*   Sensitive credentials (API keys, private keys) must be accessed via `process.env` and never hardcoded.

### 5. User Interface & Feedback
*   Use modals or toasts to confirm successful scans or data submissions.
*   Maintain a clean, minimal aesthetic consistent with the current orange/red/yellow color palette.