# 🎨 Tralalero Tralala - Kanban Collaboratif Premium en Temps Réel

> **"Trello... Mais en mieux, plus beau et instantané !"**

**Tralalero** est une application web de gestion de projet type **Kanban** entièrement construite en **Vanilla JavaScript** (ES6+), **Vanilla CSS** et **Tailwind CSS**, propulsée par un backend en temps réel avec **Supabase**. 

Conçu avec une esthétique **Glassmorphism** moderne et épurée, Tralalero offre une expérience utilisateur ultra-fluide, des micro-animations soignées et une synchronisation collaborative instantanée sans aucun framework lourd (sans React, Vue ni Angular).

![Status](https://img.shields.io/badge/status-Production--Ready-success.svg?style=for-the-badge&logo=statuspage)
![Supabase](https://img.shields.io/badge/Supabase-Realtime-3ECF8E?style=for-the-badge&logo=supabase)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-v3--CDN-38B2AC?style=for-the-badge&logo=tailwind-css)
![Vanilla JS](https://img.shields.io/badge/Vanilla_JS-ES6+-F7DF1E?style=for-the-badge&logo=javascript)

---

## 📸 Aperçu & Design
L'application adopte un design haut de gamme fondé sur le **Glassmorphism** (transparence, flou d'arrière-plan `backdrop-filter`, bordures lumineuses subtiles) qui s'adapte à tous vos fonds d'écran.

*   **Fonds d'écran dynamiques** : Choisissez parmi des dégradés vibrants et des photos artistiques via le panneau d'apparence.
*   **Contraste adaptatif** : Les éléments textuels, les badges et les états vides s'ajustent pour rester lisibles et contrastés, peu importe le fond d'écran.
*   **Micro-animations** : Effets de survol élégants, pop-in à la création de cartes, transitions fluides et animations de chargement.

---

## ✨ Fonctionnalités Majeures

### 🚀 Gestion Kanban Intuitive
*   **Listes & Cartes illimitées** : Créez des colonnes et des cartes pour structurer vos tâches.
*   **Drag & Drop Avancé** : Réorganisez vos listes horizontalement ou déplacez vos cartes entre les colonnes grâce à une intégration fluide de **SortableJS**.
*   **Repli de Colonnes** : Réduisez le bruit visuel en pliant temporairement les colonnes à leur seul en-tête.
*   **Accents de Couleur** : Personnalisez chaque colonne avec une bordure de couleur thématique (rouge, bleu, vert, violet...) pour mieux organiser vos priorités.
*   **Création rapide** : Un bouton d'ajout direct `+` dans l'en-tête de chaque colonne et un état vide cliquable permettent d'ajouter des tâches en un clic.

### ⚡ Collaboration en Temps Réel
*   **Synchronisation Instantanée** : Les modifications (déplacement de cartes, édition, commentaires) se synchronisent sur tous les écrans connectés via **Supabase Realtime**.
*   **Système Anti-Écho & Fusion Naïve** : Les requêtes simultanées fusionnent intelligemment (par exemple, pour préserver les commentaires de chacun sans écraser le travail des autres).
*   **Partage Simple** : Générez et copiez en un clic un lien unique incluant l'identifiant du tableau (ex: `https://tralalero.app/#id-unique`).
*   **Chat Collaboratif** : Un chat intégré en temps réel avec indicateur de messages non lus pour échanger des idées en direct.
*   **Identité Personnalisée** : Modifiez votre pseudo, vos initiales et la couleur de votre avatar pour vous faire identifier instantanément par vos collaborateurs.

### 📝 Édition Enrichie des Cartes
*   **Éditeur Modal** : Ouvrez une carte pour accéder à ses options complètes.
*   **Listes de Contrôle (Checklists)** : Ajoutez des sous-tâches avec une **barre de progression colorée** qui s'ajuste dynamiquement.
*   **Descriptions en Markdown** : Rédigez des descriptions claires supportant le formatage riche Markdown.
*   **Commentaires et Historique** : Publiez des messages sur les cartes et visualisez un journal d'activité (Audit Log) listant toutes les actions effectuées.
*   **Images & Couleurs de Couverture** : Personnalisez l'en-tête visuel de vos cartes avec des images ou des couleurs.
*   **Dates d'échéance** : Planifiez vos tâches avec des notifications visuelles en cas de retard.

### 🛠️ Productivité & Outils Pratiques
*   **Filtres & Recherche multicritère** : Filtrez instantanément par mot-clé, par membre assigné ou par étiquette (labels), avec affichage de puces d'activation (`chips`) désactivables individuellement.
*   **Sélection & Actions en Lot (Bulk Actions)** : Activez le mode sélection pour associer des membres, ajouter des étiquettes ou supprimer plusieurs cartes simultanément.
*   **Import / Export JSON** : Sauvegardez ou importez vos listes de cartes instantanément en collant un simple tableau JSON.
*   **Historique Local** : Retrouvez rapidement vos tableaux récemment visités grâce à une liste sauvegardée dans le `localStorage` de votre navigateur.
*   **Récompenses de fin** : Une explosion de confettis se déclenche lorsqu'une tâche est déplacée vers une colonne contenant des mots-clés de réussite (Fait, Terminé, Done, Fini, etc.).

---

## 📂 Architecture des Fichiers

Le projet est entièrement modulaire et organisé pour faciliter sa maintenance :

```text
├── index.html          # Structure de l'application & inclusion des CDN
├── style.css           # Thème global, glassmorphism, animations et styles des composants
├── logo.png            # Logo officiel de Tralalero
├── js/
│   ├── main.js         # Point d'entrée de l'application et cycle d'initialisation
│   ├── config.js       # Variables d'environnement (Supabase URL/Key) et palettes de couleurs
│   ├── state.js        # Gestion de l'état global partagé de l'application
│   ├── db.js           # Échanges de données avec Supabase & Abonnements Temps Réel
│   ├── render.js       # Rendu dynamique du DOM (tableau, modals, filtres)
│   ├── dragdrop.js     # Logique de Drag & Drop (SortableJS) pour les cartes et colonnes
│   ├── modal.js        # Logique d'affichage et actions de la modale d'édition de carte
│   ├── ui.js           # Manipulation d'UI générique (toasts, barres de progression, etc.)
│   ├── chat-drag.js    # Logiciel du chat collaboratif en temps réel
│   ├── settings.js     # Gestion des membres et des étiquettes du projet
│   ├── appearance.js   # Personnalisation de l'arrière-plan et du style visuel
│   ├── selection.js    # Logique d'édition et suppression en lot (Bulk Select)
│   ├── landing.js      # Accueil, création de nouveaux tableaux et historique local
│   └── import.js       # Fonctionnalités d'importation de cartes en JSON
```

---

## ⚙️ Configuration de la Base de Données

Tralalero repose sur une table PostgreSQL unique dans **Supabase**.

### 1. Structure SQL de la Table `boards`

Exécutez ce script SQL dans l'éditeur de requêtes (SQL Editor) de votre console Supabase :

```sql
CREATE TABLE boards (
    id TEXT PRIMARY KEY,
    app_id TEXT DEFAULT 'default-app-id',
    board_data JSONB DEFAULT '[]'::jsonb,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. Activation du Temps Réel (Realtime)

Pour que la synchronisation instantanée fonctionne entre les différents navigateurs, vous devez activer les publications de type Realtime sur cette table :

```sql
-- Ajout de la table boards aux publications realtime de Supabase
ALTER PUBLICATION supabase_realtime ADD TABLE boards;
```

### 3. Connexion de votre Instance

Ouvrez le fichier [js/config.js](file:///c:/Users/User/Documents/Tralalero-main/js/config.js) et remplacez les valeurs par les identifiants de votre projet Supabase :

```javascript
const SUPABASE_URL = 'VOTRE_SUPABASE_URL';
const SUPABASE_KEY = 'VOTRE_SUPABASE_ANON_KEY';
```

---

## 🛠️ Lancement Local

1. Clonez ce dépôt sur votre machine locale.
2. Ouvrez simplement le fichier `index.html` dans votre navigateur préféré.
3. *Alternative conseillée* : Utilisez un serveur de développement local comme **Live Server** (extension VS Code) ou exécutez la commande suivante si vous disposez de Node.js :
   ```bash
   npx serve .
   ```
4. Accédez à l'adresse fournie (ex: `http://localhost:3000`) pour commencer à organiser vos projets !

---

## 📄 Licence

Ce projet est distribué sous licence MIT. Libre à vous de le modifier et de l'adapter selon vos besoins.
