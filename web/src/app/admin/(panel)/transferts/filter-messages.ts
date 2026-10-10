import { defineMessages } from "@/i18n/define";

/** Textes de la recherche des transferts (admin). */
export const filterMessages = defineMessages({
  fr: {
    resultsTitle: "Résultats de la recherche",
    search: "Rechercher",
    searchPlaceholder: "Réf., nom, courriel, téléphone",
    status: "Statut",
    all: "Tous",
    todo: "À traiter",
    progress: "En cours",
    delivered: "Livrés",
    closed: "Expirés ou annulés",
    apply: "Filtrer",
    reset: "Effacer",
    results: "{n} résultat(s)",
    resultsCapped: "{n} premiers résultats — affinez la recherche",
    noResults: "Aucun transfert ne correspond à cette recherche.",
  },
  en: {
    resultsTitle: "Search results",
    search: "Search",
    searchPlaceholder: "Reference, name, email or phone",
    status: "Status",
    all: "All",
    todo: "To handle",
    progress: "In progress",
    delivered: "Delivered",
    closed: "Expired or cancelled",
    apply: "Filter",
    reset: "Clear",
    results: "{n} result(s)",
    resultsCapped: "First {n} results — refine your search",
    noResults: "No transfer matches this search.",
  },
});
