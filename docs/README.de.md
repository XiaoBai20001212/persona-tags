[简体中文](../README.md) | [English](README.en.md) | [繁體中文](README.zh-TW.md) | [Русский](README.ru.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Português (BR)](README.pt-BR.md) | **Deutsch** | [Français](README.fr.md) | [ไทย](README.th.md) | [Tiếng Việt](README.vi.md) | [Bahasa Indonesia](README.id.md)

# Persona Tags

Eine erweiterte Erweiterung für die Persona-Verwaltung in SillyTavern.

Wenn deine Persona-Liste stark anwächst, verliert man schnell den Überblick, wer wer ist. Mit dieser Erweiterung kannst du Personas mit Tags versehen, nach Tags filtern, im Stapel bearbeiten und frei neu anordnen, damit alles übersichtlich und leicht auffindbar bleibt.

| Übersicht & Schnellauswahl vorhandener Tags | Tag-Filter & Stapelverarbeitung |
| :---: | :---: |
| ![Übersicht & Schnellauswahl vorhandener Tags](images/en-overview.png) | ![Tag-Filter & Stapelverarbeitung](images/en-batch.png) |

## Funktionen

### Tag-System
- Tags zu Personas hinzufügen (kommagetrennt, um mehrere auf einmal hinzuzufügen)
- Ausklappbare Schnellauswahl **Vorhandene Tags** in der rechten Spalte (blendet Tags, die der aktuellen Persona bereits zugewiesen sind, automatisch aus – mit flüssigem Scrollen bei vielen Tags)
- Personas nach Tags filtern, sowohl im Modus **Einschließen** (nur passende anzeigen) als auch **Ausschließen** (passende ausblenden)
- Tags im Filterbereich gedrückt halten, um sie per Drag-and-drop neu anzuordnen
- Tags von Personas, die mit dem aktuellen Charakter verknüpft sind, leuchten dezent hervor
- Tags direkt auf jeder Persona-Karte anzeigen
- Start-Tags direkt im Dialog zum Erstellen einer Persona hinzufügen

### Stapelbearbeitung
- Auf **Stapel** klicken, um in den Stapelmodus mit Kontrollkästchen auf jeder Karte zu wechseln
- Alle wählen / Auswahl leeren
- Tags im Stapel hinzufügen, Tags im Stapel entfernen und Personas im Stapel löschen

### Sortierung & Reihenfolge
- Persona-Karten gedrückt halten, um sie per Drag-and-drop neu anzuordnen (mobilfreundlich)
- Eine genaue Positionsnummer in der rechten Spalte eingeben, um direkt dorthin zu springen
- Zeigt den aktuellen Positionsindex auf jeder Karte an
- Unabhängige Sortierreihenfolgen für **Alle** Personas sowie für die verknüpften Personas jedes einzelnen Charakters oder jeder Gruppe

### Ansichten & Navigation
- Ansicht **Verknüpft**: zeigt nur Personas an, die mit dem aktuellen Charakter/der aktuellen Gruppe verknüpft sind
- Ansicht **Alle**: zeigt alle Personas an
- Schnellscroll-Pfeile **↑ / ↓** oben: um eine benutzerdefinierte Anzahl an Personas springen (Standard `10`, bleibt sitzungsübergreifend gespeichert); `0,5 s` gedrückt halten, um direkt an den Anfang oder das Ende zu springen
- Manueller Aktualisieren-Button zum Neuladen der Liste
- Unterstützt sowohl die Listenansicht als auch die Rasteransicht

### Lokalisierung & weiteres
- Vollständige Unterstützung für alle **17 offiziellen SillyTavern-Oberflächensprachen**, passt sich automatisch deiner SillyTavern-Spracheinstellung an (fällt bei nicht unterstützten oder zukünftigen Sprachen auf Englisch zurück)
- Optionale Kontrollkästchen für **Tags kopieren** und **Verknüpfungen kopieren** beim Duplizieren einer Persona
- Verbessertes Auswahl-Popup mit Avatar, Name und Tags, wenn mehrere Personas mit demselben Charakter verknüpft sind
- Persona-Backup & -Wiederherstellung sichern automatisch Tags, benutzerdefinierte Sortierreihenfolgen und Schnellscroll-Einstellungen mit

## Installation

### Methode 1: Direkt in SillyTavern installieren (Empfohlen)

1. Öffne SillyTavern und klicke auf **Erweiterungen** (das Würfel-Symbol in der oberen Leiste)
2. Klicke auf **Erweiterung installieren**
3. Füge die folgende Repository-URL ein, installiere die Erweiterung und lade die Seite neu:

```
https://github.com/XiaoBai20001212/persona-tags
```

> Zukünftige Updates können direkt über **Erweiterungen verwalten** installiert werden.

### Methode 2: Manuelle Installation

Lade das Repository herunter, entpacke es und lege den gesamten Ordner `persona-tags` in folgendes Verzeichnis:

```
SillyTavern/public/scripts/extensions/third-party/persona-tags/
```

Lade die Seite neu – und schon kann es losgehen.

## Datenspeicherung

Tag- und Sortierdaten werden in SillyTaverns `extension_settings` gespeichert, ohne deine ursprünglichen Persona-Daten zu verändern. Wenn du den Erweiterungsordner entfernst, wird die Standardoberfläche wieder sauber hergestellt, ohne SillyTavern zu beeinträchtigen.

## Autoren

- [小白](https://github.com/XiaoBai20001212)
- [好大一只鱼](https://github.com/haodayizhiyu404)
