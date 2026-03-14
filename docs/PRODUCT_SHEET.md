# Fiche Produit : ITSM Dashboard (v1.2)
## Gestion Intelligente du Capital Technologique

**Nom de l'application :** ITSM Dashboard  
**Type d'application :** Web (SaaS Ready)  
**Secteur :** Gestion de parc informatique et logistique d'entreprise

---

## 1. Présentation Générale
L'**ITSM Dashboard** est une solution de pilotage stratégique conçue pour offrir aux organisations une maîtrise totale sur le cycle de vie de leurs équipements. Bien plus qu'un simple inventaire, l'application agit comme une tour de contrôle permettant de suivre chaque actif, de son acquisition à sa réforme, garantissant ainsi une transparence absolue et une optimisation des coûts opérationnels.

### Problème Résolu
La plupart des entreprises souffrent de "zones d'ombre" dans leur inventaire : équipements perdus lors des départs d'employés, achats en urgence faute de stock, ou manque de traçabilité lors des réparations. L'ITSM Dashboard élimine ces frictions en centralisant les données et en automatisant les processus de distribution.

### Objectifs
*   **Centraliser** la "source unique de vérité" pour tout le matériel.
*   **Automatiser** la paperasse administrative (décharges, attestations).
*   **Anticiper** les besoins de réapprovisionnement via des alertes stratégiques.
*   **Garantir** une traçabilité complète pour les audits internes et externes.

---

## 2. Fonctionnalités Principales

### A. Tableau de Bord Analytique
*   **Fonctionnement :** Visualisation en temps réel des indicateurs clés (KPIs) : total d'articles, stock disponible, matériel en réparation, et répartition par structure.
*   **Valeur :** Permet aux directeurs de prendre des décisions basées sur des données réelles plutôt que sur des estimations.

### B. Alertes de Stock Stratégique
*   **Fonctionnement :** Un algorithme surveille les niveaux de stock par rapport à un seuil critique défini. Les articles en sous-effectif sont immédiatement signalés en haut du tableau de bord.
*   **Valeur :** Évite les ruptures de stock critiques et permet une planification budgétaire proactive.

### C. Wizards de Flux de Travail (Arrivages, Distributions, Retours)
*   **Fonctionnement :** Des assistants étape par étape guident l'utilisateur pour enregistrer les entrées de matériel, les distributions aux employés ou les retours (reversements).
*   **Valeur :** Réduit les erreurs de saisie et assure que chaque mouvement est documenté avec les informations nécessaires (bénéficiaire, budget, remarques).

### D. Palette de Commande Globale (Ctrl+K)
*   **Fonctionnement :** Un moteur de recherche instantané accessible de n'importe où pour trouver un numéro de série, une personne ou une structure.
*   **Valeur :** Gain de temps massif pour la navigation quotidienne et l'accès rapide aux fiches d'historique.

### E. Traçabilité et Historique Complet
*   **Fonctionnement :** Chaque article, personne et structure possède un journal d'audit complet détaillant chaque mouvement passé et présent.
*   **Valeur :** Indispensable lors des inventaires annuels ou pour retrouver la trace d'un matériel après plusieurs années.

---

## 3. Architecture et Technologies

L'application repose sur une pile technologique moderne, robuste et sécurisée :

*   **Framework :** Next.js 15 avec React pour une interface fluide et performante.
*   **Interface :** Tailwind CSS et ShadCN UI pour un design professionnel, responsive et compatible avec le mode sombre.
*   **Sécurité :** Intégration native avec **Keycloak** pour une authentification d'entreprise (SSO) et une gestion fine des accès.
*   **IA / Agents :** Propulsé par **Genkit**, permettant l'intégration d'assistants intelligents pour l'analyse prédictive des stocks et la recherche en langage naturel.
*   **API :** Communication optimisée via Axios avec rafraîchissement proactif des jetons de session pour une stabilité maximale.

---

## 4. Parcours Utilisateur (User Flow)

1.  **Réception :** Le logisticien enregistre un arrivage de 50 ordinateurs via le wizard, télécharge l'attestation et le matériel entre en "Stock Neuf".
2.  **Affectation :** Un nouvel employé arrive. Le gestionnaire utilise la recherche rapide (Ctrl+K), sélectionne un ordinateur en stock et l'assigne. Une décharge PDF est générée instantanément.
3.  **Maintenance :** Si l'ordinateur tombe en panne, il est marqué "En Réparation". L'historique de l'article conserve une trace de l'incident.
4.  **Audit :** Le directeur consulte le dashboard en fin de mois, télécharge le rapport Word consolidé et planifie les achats pour le trimestre suivant via les alertes stratégiques.

---

## 5. Avantages et Points Différenciateurs

*   **Zéro Papier :** Génération automatique de documents PDF et export Word pour tous les rapports officiels.
*   **Visuel et Intuitif :** Visualisation de la structure organisationnelle sous forme d'arbre interactif.
*   **Enterprise-Ready :** Conçu pour s'intégrer aux systèmes d'identité existants des grandes organisations.
*   **Proactif :** Ne se contente pas de lister le matériel, mais avertit l'utilisateur des actions à entreprendre (achats, réparations).

---

## 6. Public Cible
*   **Directeurs Informatiques (DSI) :** Pour la vision stratégique du parc.
*   **Responsables Logistique :** Pour la gestion opérationnelle quotidienne.
*   **Chefs de Service :** Pour le suivi du matériel affecté à leurs équipes.
*   **Auditeurs et Comptables :** Pour la vérification de l'inventaire physique.

---

## 7. Perspectives d'Évolution
*   **Scan Mobile :** Introduction d'une application mobile pour scanner les codes-barres/QR codes directement en entrepôt.
*   **Maintenance Prédictive :** Utilisation de l'IA pour prédire les pannes en fonction de l'âge et du modèle du matériel.
*   **Signature Électronique :** Intégration de la signature tactile directement sur tablette lors de la remise du matériel.

---

**ITSM Dashboard : Transformez votre logistique subie en un avantage stratégique.**