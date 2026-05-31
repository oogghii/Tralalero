# 🎨 Tralalero Tralala - Kanban Collaboratif Premium en Temps Réel

> **"Trello... Mais en mieux, plus beau et instantané !"**

**Tralalero** est une application web de gestion de projet type **Kanban** entièrement construite en **Vanilla JavaScript** (ES6+), **Vanilla CSS** et **Tailwind CSS**, propulsée par un backend en temps réel avec **Supabase**.

Conçu avec une esthétique **Glassmorphism** moderne et épurée, Tralalero offre une expérience utilisateur ultra-fluide, des micro-animations soignées et une synchronisation collaborative instantanée sans aucun framework lourd (sans React, Vue ni Angular).

![Status](https://img.shields.io/badge/status-Production--Ready-success.svg?style=for-the-badge&logo=statuspage)
![Supabase](https://img.shields.io/badge/Supabase-Realtime-3ECF8E?style=for-the-badge&logo=supabase)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-v3--CDN-38B2AC?style=for-the-badge&logo=tailwind-css)
![Vanilla JS](https://img.shields.io/badge/Vanilla_JS-ES6+-F7DF1E?style=for-the-badge&logo=javascript)

---

## 📸 Présentation & Design
L'application adopte un design haut de gamme fondé sur le **Glassmorphism** (transparence, flou d'arrière-plan `backdrop-filter`, bordures lumineuses subtiles) qui s'adapte à tous les fonds d'écran.

*   **Fonds d'écran dynamiques** : Prise en charge de dégradés vibrants et de photos artistiques via un panneau d'apparence dédié.
*   **Contraste adaptatif** : Ajustement dynamique de la lisibilité des éléments textuels, des badges et des états vides pour s'adapter à toutes les teintes d'arrière-plan.
*   **Micro-animations** : Effets de survol interactifs, pop-in à la création de cartes, transitions fluides et animations de chargement.

---

## ✨ Fonctionnalités Majeures

### 🚀 Gestion Kanban Intuitive
*   **Listes & Cartes illimitées** : Création et gestion dynamique de colonnes et de cartes pour structurer les tâches.
*   **Drag & Drop Avancé** : Réorganisation horizontale des listes et déplacement des cartes entre les colonnes via une intégration fluide de **SortableJS**.
*   **Repli de Colonnes** : Réduction du bruit visuel par repli temporaire des colonnes à leur seul en-tête.
*   **Accents de Couleur** : Personnalisation esthétique de chaque colonne avec une bordure thématique de couleur au choix.
*   **Création rapide** : Raccourcis d'ajout rapide `+` dans les en-têtes de colonnes et états vides interactifs cliquables pour une fluidité maximale.

### ⚡ Collaboration en Temps Réel
*   **Synchronisation Instantanée** : Répercussion immédiate de toutes les modifications (déplacements, éditions, commentaires) sur tous les écrans connectés via **Supabase Realtime**.
*   **Système Anti-Écho & Fusion Naïve** : Fusion intelligente des écritures simultanées (par exemple, pour préserver les commentaires de chacun sans écraser le travail des autres).
*   **Partage Simple** : Génération instantanée d'un lien unique incluant l'identifiant du tableau (ex: `https://tralalero.app/#id-unique`).
*   **Chat Collaboratif** : Messagerie instantanée intégrée en temps réel avec indicateur visuel de messages non lus.
*   **Identité Personnalisée** : Choix du pseudonyme, des initiales et de la couleur de l'avatar pour chaque utilisateur connecté.

### 📝 Édition Enrichie des Cartes
*   **Éditeur Modal** : Vue détaillée complète pour chaque tâche du tableau.
*   **Listes de Contrôle (Checklists)** : Sous-tâches interactives accompagnées d'une **barre de progression colorée** dynamique.
*   **Descriptions en Markdown** : Rédacteur de notes claires supportant le formatage riche Markdown.
*   **Commentaires et Historique** : Espace d'échange et journal d'activité (Audit Log) retraçant toutes les actions appliquées à une carte.
*   **Couvertures de Tâches** : Illustration visuelle des cartes à l'aide d'images de couverture ou de bandeaux de couleur.
*   **Dates d'échéance** : Planification temporelle avec indicateur visuel en cas de retard.

### 🛠️ Productivité & Outils Pratiques
*   **Filtres & Recherche multicritère** : Filtrage instantané par mot-clé, membre assigné ou étiquette (labels), avec puces d'activation (`chips`) révocables en un clic.
*   **Sélection & Actions en Lot (Bulk Actions)** : Mode de sélection multiple permettant d'associer des membres, appliquer des étiquettes ou supprimer plusieurs cartes simultanément.
*   **Import / Export JSON** : Sauvegarde et restauration instantanées de listes de cartes via l'importation de tableaux structurés en JSON.
*   **Historique Local** : Mémorisation des derniers tableaux visités dans le `localStorage` du navigateur pour un accès rapide au démarrage.
*   **Confettis** : Déclenchement automatique d'effets visuels festifs lorsque des cartes sont déposées dans les colonnes de succès (ex: "Fait", "Terminé", "Done").

---

## 📂 Architecture Technique & Modularité

Le code source privilégie une structure modulaire sans framework, articulée autour de fichiers JavaScript spécialisés :

```text
├── index.html          # Structure de l'application & inclusion des CDN
├── style.css           # Thème global, glassmorphism, animations et styles des composants
├── logo.png            # Logo officiel de Tralalero
├── js/
│   ├── main.js         # Point d'entrée et cycle d'initialisation applicatif
│   ├── config.js       # Variables d'environnement et palettes de couleurs statiques
│   ├── state.js        # Centralisation de l'état global partagé de l'application
│   ├── db.js           # Gestion des requêtes de persistance et des canaux de synchronisation Supabase
│   ├── render.js       # Moteur de rendu dynamique du DOM (tableau, modals, filtres, chips)
│   ├── dragdrop.js     # Gestionnaire SortableJS pour le glisser-déposer des cartes et colonnes
│   ├── modal.js        # Logique d'affichage et actions de la modale d'édition de carte
│   ├── ui.js           # Contrôles d'interface génériques (toasts, barres de progression)
│   ├── chat-drag.js    # Logique de fonctionnement du chat collaboratif
│   ├── settings.js     # Gestion de la configuration des membres et des étiquettes
│   ├── appearance.js   # Personnalisation visuelle (arrière-plan, verre, flou)
│   ├── selection.js    # Logique d'édition et suppression en lot (Bulk Select)
│   ├── landing.js      # Écrans d'accueil, historique local et création de projets
│   └── import.js       # Logique de parsing et d'importation de listes au format JSON
```

---

## 🗄️ Modèle de Données & Infrastructure

Pour assurer sa synchronisation temps réel, Tralalero repose sur une infrastructure simple hébergée sur **Supabase**.

### Schéma SQL de la Table `boards`

La structure de données est optimisée autour d'une unique table PostgreSQL exploitant des champs JSONB flexibles pour modéliser le tableau et ses réglages :

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

### Mécanisme de Réplication Realtime

La synchronisation instantanée inter-navigateurs utilise le moteur de réplication de Supabase, connecté directement sur les événements de la table :

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE boards;
```

---

## 📄 Licence

Ce projet est distribué sous licence MIT.
