# Agen LPG - Management and Monitoring System

A comprehensive web-based platform tailored for managing and monitoring 3Kg LPG distribution bases (Pangkalan) in the West Jakarta region. This application streamlines operational data, tracks distribution status, and provides an integrated map interface for effective spatial monitoring.

## Features

- **Pangkalan Management**: Complete CRUD operations for Pangkalan data including registration IDs, owner information, and contact details.
- **Spatial Monitoring**: Interactive map interfaces for monitoring Pangkalan locations using integrated Google Maps layers.
- **Status Tracking**: Toggle operational status (Active/Inactive) and track document completeness for each Pangkalan.
- **Reporting & Export**: Built-in functionality to export Pangkalan data into PDF and Excel formats.
- **Photo Documentation**: Dynamic photo upload and management system for site verification.
- **Responsive Design**: Fluid and modern user interface that adapts seamlessly to desktop and mobile devices.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org) (App Router)
- **Styling**: Vanilla CSS with modern flexbox/grid architectures
- **Database & Authentication**: [Supabase](https://supabase.com)
- **Maps Integration**: Leaflet.js
- **Icons**: Lucide React

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (version 18 or higher)
- npm, yarn, or pnpm
- A Supabase project (for database and authentication)

## Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd agen-lpg-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env.local` file in the root directory and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deployment

This project is optimized for deployment on [Netlify](https://www.netlify.com/).

1. Connect your GitHub repository to Netlify.
2. Netlify will automatically detect the Next.js framework.
3. Ensure your environment variables (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`) are set in the Netlify dashboard.
4. Deploy the site.

The project includes a `netlify.toml` file to guarantee correct build commands and output directories.

## Architecture & SEO

- **Next.js Turbopack**: Accelerated local development.
- **SEO Optimized**: Pre-configured with Open Graph (OGP) tags, Twitter Cards, dynamic `sitemap.xml`, and `robots.txt` for enhanced search engine visibility.

## License

Copyright 2026 Agen LPG. All rights reserved.
