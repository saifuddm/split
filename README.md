# Split - An Expense Splitting App

[![Netlify Status](https://api.netlify.com/api/v1/badges/dac858dd-2089-42eb-879d-eb02f21b90a3/deploy-status?branch=main)](https://app.netlify.com/projects/split-saifuddm/deploys)

A modern, front-end clone of Splitwise built with React and TypeScript. This application allows users to create groups, add shared expenses, and easily track who owes who. It features advanced splitting options and a clear, simplified view of all debts.

## Core Features

-   **Group Management:** Create and manage groups with multiple members.
-   **Advanced Expense Splitting:**
    -   Split equally, by exact amounts, or by percentage.
    -   Select specific participants for each expense.
    -   Exclude the payer from a split ("I am owed the full amount").
-   **Expense Editing & History:** Edit any detail of an expense after its creation. A detailed, multi-line audit trail tracks every change.
-   **Simplified Debt Calculation:** View a clear, settled-up list of "who owes who" in each group and on the main dashboard.
-   **Settle Up Functionality:** Record payments to others to settle debts, which are displayed as distinct events in the group feed.

## Tech Stack

-   **Framework:** React 19 (with Vite)
-   **Language:** TypeScript
-   **Styling:** Tailwind CSS
-   **State Management:** Zustand
-   **Icons:** Lucide React

## Getting Started

To run this project locally, follow these steps:

1.  **Clone the repository:**
    ```sh
    git clone <repository-url>
    cd <repository-folder>
    ```
2.  **Install dependencies:**
    This project uses `bun` as its package manager.
    ```sh
    bun install
    ```
3.  **Run the development server:**
    ```sh
    bun run dev
    ```
    The application will be available at `http://localhost:5173`.