#!/bin/bash

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "Node.js n'est pas installé. Veuillez l'installer avant de continuer."
    exit 1
fi

# Vérifier si npm est installé
if ! command -v npm &> /dev/null; then
    echo "npm n'est pas installé. Veuillez l'installer avant de continuer."
    exit 1
fi

# Installer les dépendances si node_modules n'existe pas
if [ ! -d "node_modules" ]; then
    echo "Installation des dépendances..."
    npm install
fi

# Construire l'application si .next n'existe pas
if [ ! -d ".next" ]; then
    echo "Construction de l'application..."
    npm run build
fi

# Démarrer le serveur
echo "Démarrage du serveur..."
npm start
