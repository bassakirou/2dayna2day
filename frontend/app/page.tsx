import React from "react";

export default function RootPage() {
  return (
    <html lang="fr">
      <head>
        <meta httpEquiv="refresh" content="0; url=/fr" />
      </head>
      <body>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium animate-pulse">Redirection vers la page d&apos;accueil...</p>
        </div>
        <script dangerouslySetInnerHTML={{ __html: `window.location.href = '/fr';` }} />
      </body>
    </html>
  );
}
