"use client";

import { useEffect, useState } from "react";

export type Language = "en" | "de" | "ro";

type Messages = Record<string, string>;

const STORAGE_KEY = "pitty-language";

export const languages: { code: Language; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "de", label: "DE" },
  { code: "ro", label: "RO" }
];

export const messages: Record<Language, Messages> = {
  en: {
    workerDashboard: "Worker dashboard",
    clientDashboard: "Client dashboard",
    hi: "Hi, {name}",
    signOut: "Sign out",
    language: "Language",
    appName: "Pitty Work Log",
    signIn: "Sign in",
    signingIn: "Signing in...",
    loginHelp: "Use the email and password from Supabase Auth.",
    missingProfile: "Your account is missing a profile row. Add one in Supabase before signing in.",
    signedInMissingProfile: "Signed in, but this account does not have a profile row.",
    email: "Email",
    password: "Password",
    pauseStatus: "Pause status",
    pausedFor: "Paused for {hours}h {minutes}m {seconds}s",
    readyToLogWork: "Ready to log work",
    startPause: "Start pause",
    stopPause: "Stop pause",
    durationHours: "Duration hours",
    durationPlaceholder: "e.g. 2",
    savePause: "Save pause",
    pauseEnds: "Pause ends",
    update: "Update",
    newSession: "New session",
    logWork: "Log work",
    workType: "Work type",
    manual: "Manual",
    manualTimeline: "manual",
    excavator: "Excavator",
    excavatorTimeline: "excavator",
    start: "Start",
    end: "End",
    rate: "Rate (EUR/hour)",
    ratePlaceholder: "e.g. 25",
    saveSession: "Save session",
    disabledWhilePaused: "Work logging is disabled while the pause is active.",
    manualHours: "Manual hours",
    excavatorHours: "Excavator hours",
    grandTotal: "Grand total",
    combinedHours: "Combined hours",
    today: "Today",
    todayTimeline: "Today timeline",
    byDay: "By day",
    byWeek: "By week",
    hoursByDay: "Hours by day",
    hoursByWeek: "Hours by week",
    history: "History",
    hideHistory: "Hide history",
    recentSessions: "Recent sessions",
    type: "Type",
    hours: "Hours",
    period: "Period",
    totalHours: "Total hours",
    total: "Total",
    totalEarnings: "Total earnings",
    rateShort: "Rate",
    earnings: "Earnings",
    noSessions: "No sessions yet.",
    noSummary: "No summary yet.",
    workSessions: "Work sessions",
    worker: "Worker",
    idle: "Idle",
    pauses: "Pauses",
    pauseTimeline: "pause",
    duration: "Duration",
    noWorkSessions: "No work sessions yet.",
    noPauses: "No pauses yet.",
    done: "Done",
    selectStartTime: "Select start time",
    selectEndTime: "Select end time"
  },
  de: {
    workerDashboard: "Arbeiter-Dashboard",
    clientDashboard: "Kunden-Dashboard",
    hi: "Hallo, {name}",
    signOut: "Abmelden",
    language: "Sprache",
    appName: "Pitty Arbeitsprotokoll",
    signIn: "Anmelden",
    signingIn: "Anmeldung...",
    loginHelp: "Nutzen Sie E-Mail und Passwort aus Supabase Auth.",
    missingProfile: "Dieses Konto hat kein Profil. Fuegen Sie vor der Anmeldung ein Profil in Supabase hinzu.",
    signedInMissingProfile: "Angemeldet, aber dieses Konto hat kein Profil.",
    email: "E-Mail",
    password: "Passwort",
    pauseStatus: "Pausenstatus",
    pausedFor: "Pausiert fuer {hours}h {minutes}m {seconds}s",
    readyToLogWork: "Bereit zum Eintragen",
    startPause: "Pause starten",
    stopPause: "Pause stoppen",
    durationHours: "Dauer in Stunden",
    durationPlaceholder: "z. B. 2",
    savePause: "Pause speichern",
    pauseEnds: "Pause endet",
    update: "Aktualisieren",
    newSession: "Neue Sitzung",
    logWork: "Arbeit eintragen",
    workType: "Arbeitsart",
    manual: "Handarbeit",
    manualTimeline: "handarbeit",
    excavator: "Bagger",
    excavatorTimeline: "bagger",
    start: "Beginn",
    end: "Ende",
    rate: "Satz (EUR/Stunde)",
    ratePlaceholder: "z. B. 25",
    saveSession: "Sitzung speichern",
    disabledWhilePaused: "Arbeit kann waehrend einer aktiven Pause nicht eingetragen werden.",
    manualHours: "Handarbeit Stunden",
    excavatorHours: "Bagger Stunden",
    grandTotal: "Gesamtsumme",
    combinedHours: "Stunden gesamt",
    today: "Heute",
    todayTimeline: "Tagesverlauf",
    byDay: "Nach Tag",
    byWeek: "Nach Woche",
    hoursByDay: "Stunden nach Tag",
    hoursByWeek: "Stunden nach Woche",
    history: "Verlauf",
    hideHistory: "Verlauf ausblenden",
    recentSessions: "Letzte Sitzungen",
    type: "Art",
    hours: "Stunden",
    period: "Zeitraum",
    totalHours: "Stunden gesamt",
    total: "Gesamt",
    totalEarnings: "Verdienst gesamt",
    rateShort: "Satz",
    earnings: "Verdienst",
    noSessions: "Noch keine Sitzungen.",
    noSummary: "Noch keine Zusammenfassung.",
    workSessions: "Arbeitssitzungen",
    worker: "Arbeiter",
    idle: "Leerlauf",
    pauses: "Pausen",
    pauseTimeline: "pause",
    duration: "Dauer",
    noWorkSessions: "Noch keine Arbeitssitzungen.",
    noPauses: "Noch keine Pausen.",
    done: "Fertig",
    selectStartTime: "Beginn waehlen",
    selectEndTime: "Ende waehlen"
  },
  ro: {
    workerDashboard: "Panou lucrator",
    clientDashboard: "Panou client",
    hi: "Salut, {name}",
    signOut: "Deconectare",
    language: "Limba",
    appName: "Jurnal de lucru Pitty",
    signIn: "Autentificare",
    signingIn: "Se autentifica...",
    loginHelp: "Foloseste emailul si parola din Supabase Auth.",
    missingProfile: "Contul nu are profil. Adauga un profil in Supabase inainte de autentificare.",
    signedInMissingProfile: "Autentificat, dar acest cont nu are profil.",
    email: "Email",
    password: "Parola",
    pauseStatus: "Status pauza",
    pausedFor: "Pauza pentru {hours}h {minutes}m {seconds}s",
    readyToLogWork: "Gata pentru inregistrare",
    startPause: "Porneste pauza",
    stopPause: "Opreste pauza",
    durationHours: "Durata in ore",
    durationPlaceholder: "ex. 2",
    savePause: "Salveaza pauza",
    pauseEnds: "Pauza se termina",
    update: "Actualizeaza",
    newSession: "Sesiune noua",
    logWork: "Inregistreaza lucrul",
    workType: "Tip lucrare",
    manual: "Manual",
    manualTimeline: "manual",
    excavator: "Excavator",
    excavatorTimeline: "excavator",
    start: "Start",
    end: "Final",
    rate: "Tarif (EUR/ora)",
    ratePlaceholder: "ex. 25",
    saveSession: "Salveaza sesiunea",
    disabledWhilePaused: "Inregistrarea lucrului este dezactivata cat timp pauza este activa.",
    manualHours: "Ore manual",
    excavatorHours: "Ore excavator",
    grandTotal: "Total general",
    combinedHours: "Ore totale",
    today: "Azi",
    todayTimeline: "Cronologia zilei",
    byDay: "Pe zi",
    byWeek: "Pe saptamana",
    hoursByDay: "Ore pe zi",
    hoursByWeek: "Ore pe saptamana",
    history: "Istoric",
    hideHistory: "Ascunde istoricul",
    recentSessions: "Sesiuni recente",
    type: "Tip",
    hours: "Ore",
    period: "Perioada",
    totalHours: "Ore totale",
    total: "Total",
    totalEarnings: "Castig total",
    rateShort: "Tarif",
    earnings: "Castig",
    noSessions: "Nu exista sesiuni.",
    noSummary: "Nu exista sumar.",
    workSessions: "Sesiuni de lucru",
    worker: "Lucrator",
    idle: "Inactiv",
    pauses: "Pauze",
    pauseTimeline: "pauza",
    duration: "Durata",
    noWorkSessions: "Nu exista sesiuni de lucru.",
    noPauses: "Nu exista pauze.",
    done: "Gata",
    selectStartTime: "Alege ora de start",
    selectEndTime: "Alege ora de final"
  }
};

export function useLanguage() {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLanguage(stored)) {
      setLanguageState(stored);
    }
  }, []);

  function setLanguage(nextLanguage: Language) {
    setLanguageState(nextLanguage);
    window.localStorage.setItem(STORAGE_KEY, nextLanguage);
  }

  function t(key: string, values?: Record<string, string | number>) {
    const template = messages[language][key] ?? messages.en[key] ?? key;
    return Object.entries(values ?? {}).reduce(
      (result, [name, value]) => result.replace(`{${name}}`, String(value)),
      template
    );
  }

  return { language, setLanguage, t };
}

export function localeForLanguage(language: Language) {
  return {
    en: "en-US",
    de: "de-DE",
    ro: "ro-RO"
  }[language];
}

function isLanguage(value: string | null): value is Language {
  return value === "en" || value === "de" || value === "ro";
}
