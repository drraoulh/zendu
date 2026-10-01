import { defineMessages } from "@/i18n/define";

/** Pages système : 404, erreur, chargement. */
export const systemMessages = defineMessages({
  fr: {
    notFoundCode: "Erreur 404",
    notFoundTitle: "Cette page s'est égarée en chemin",
    notFoundText:
      "La page que vous cherchez n'existe pas ou a été déplacée. Voici quelques pistes pour reprendre votre route.",
    errorCode: "Erreur inattendue",
    errorTitle: "Un incident est survenu",
    errorText:
      "Nous n'avons pas pu afficher cette page. Vous pouvez réessayer ; si le problème persiste, contactez-nous.",
    errorRef: "Référence de l'incident",
    retry: "Réessayer",
    home: "Accueil",
    homeDesc: "Retour à la page principale",
    send: "Envoyer de l'argent",
    sendDesc: "Démarrer un transfert",
    contact: "Contact",
    contactDesc: "Écrivez-nous, nous répondons vite",
    loading: "Chargement…",
  },
  en: {
    notFoundCode: "Error 404",
    notFoundTitle: "This page got lost along the way",
    notFoundText:
      "The page you are looking for doesn't exist or has been moved. Here are a few ways to get back on track.",
    errorCode: "Unexpected error",
    errorTitle: "Something went wrong",
    errorText:
      "We couldn't display this page. You can try again; if the problem persists, please contact us.",
    errorRef: "Incident reference",
    retry: "Try again",
    home: "Home",
    homeDesc: "Back to the main page",
    send: "Send money",
    sendDesc: "Start a transfer",
    contact: "Contact",
    contactDesc: "Write to us, we reply quickly",
    loading: "Loading…",
  },
  es: {
    notFoundCode: "Error 404",
    notFoundTitle: "Esta página se perdió en el camino",
    errorTitle: "Algo salió mal",
    retry: "Reintentar",
    home: "Inicio",
    send: "Enviar dinero",
    contact: "Contacto",
    loading: "Cargando…",
  },
  zh: {
    notFoundCode: "错误 404",
    notFoundTitle: "该页面已迷路",
    errorTitle: "出现了问题",
    retry: "重试",
    home: "首页",
    send: "汇款",
    contact: "联系我们",
    loading: "加载中…",
  },
});
