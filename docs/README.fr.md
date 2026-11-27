[简体中文](../README.md) | [English](README.en.md) | [繁體中文](README.zh-TW.md) | [Русский](README.ru.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Português (BR)](README.pt-BR.md) | [Deutsch](README.de.md) | **Français** | [ไทย](README.th.md) | [Tiếng Việt](README.vi.md) | [Bahasa Indonesia](README.id.md)

# Persona Tags

Une extension de gestion de personas améliorée pour SillyTavern.

Lorsque votre liste de personas s'allonge, il devient vite difficile de s'y retrouver. Cette extension vous permet d'ajouter des tags à vos personas, de filtrer par tag, de gérer par lot et de réorganiser librement l'ordre d'affichage pour tout garder propre et facile à trouver.

## Fonctionnalités

### Système de tags
- Ajoutez des tags aux personas (séparés par des virgules pour en ajouter plusieurs d'un coup)
- Sélecteur rapide dépliable **Tags existants** dans la colonne de droite (masque automatiquement les tags déjà présents sur le persona actuel, avec un défilement fluide lorsque vous avez de nombreux tags)
- Filtrez les personas par tags avec les modes **Inclure** (afficher uniquement les correspondances) et **Exclure** (masquer les correspondances)
- Appuyez longuement sur les tags dans le panneau de filtre pour les glisser et les réorganiser
- Les tags utilisés par les personas liés au personnage actuel brillent subtilement
- Affiche les tags directement sur chaque carte de persona
- Ajoutez des tags initiaux directement dans la fenêtre de création d'un persona

### Gestion par lot
- Cliquez sur **Par lot** pour passer en mode édition par lot avec des cases à cocher sur chaque carte
- Tout sélectionner / Effacer la sélection
- Ajoutez des tags par lot, retirez des tags par lot et supprimez des personas par lot

### Tri et réorganisation
- Appuyez longuement sur les cartes de persona pour les glisser et les réorganiser (compatible mobile)
- Saisissez un numéro de position exact dans la colonne de droite pour y accéder directement
- Affiche l'index de position actuel sur chaque carte
- Ordres de tri indépendants pour **Tous** les personas et pour les personas liés à chaque personnage ou groupe

### Vues et navigation
- Vue **Liés** : affiche uniquement les personas liés au personnage ou au groupe actuel
- Vue **Tous** : affiche tous les personas
- Saut rapide **↑ / ↓** en haut : sautez un nombre personnalisé de personas (par défaut `10`, conservé d'une session à l'autre) ; maintenez `0,5 s` pour aller directement tout en haut ou tout en bas
- Bouton d'actualisation manuelle pour recharger la liste
- Compatible avec la vue en liste et la vue en grille

### Localisation et plus
- Prise en charge complète des **17 langues officielles de l'interface SillyTavern**, en suivant automatiquement votre paramètre de langue SillyTavern (bascule sur l'anglais pour les langues non prises en charge ou futures)
- Cases à cocher optionnelles pour **Copier les tags** et **Copier les liaisons** lors de la duplication d'un persona
- Fenêtre de sélection multi-persona améliorée affichant l'avatar, le nom et les tags lorsque plusieurs personas sont liés au même personnage
- La sauvegarde et la restauration des personas incluent automatiquement les tags, les ordres de tri personnalisés et les réglages de défilement rapide

## Installation

### Méthode 1 : Installer depuis SillyTavern (Recommandé)

1. Ouvrez SillyTavern et cliquez sur **Extensions** (l'icône de cubes dans la barre supérieure)
2. Cliquez sur **Installer une extension**
3. Collez l'URL du dépôt ci-dessous, lancez l'installation puis actualisez la page :

```
https://github.com/XiaoBai20001212/persona-tags
```

> Les futures mises à jour pourront être installées directement depuis **Gérer les extensions**.

### Méthode 2 : Installation manuelle

Téléchargez et extrayez le dépôt, puis placez le dossier `persona-tags` complet dans :

```
SillyTavern/public/scripts/extensions/third-party/persona-tags/
```

Actualisez la page et vous êtes prêt.

## Stockage des données

Les données de tags et d'ordre de tri sont stockées dans `extension_settings` de SillyTavern sans modifier vos données de persona d'origine. Supprimer le dossier de l'extension restaure proprement l'interface par défaut sans affecter SillyTavern.

## Auteurs

- [小白](https://github.com/XiaoBai20001212)
- [好大一只鱼](https://github.com/haodayizhiyu404)
