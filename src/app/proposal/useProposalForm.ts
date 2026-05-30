"use client";

import { useCallback, useMemo, useReducer } from "react";

export type Form = {
  name: string;
  email: string;
  phone: string;
  affiliation: string;
  jobTitle: string;
  pronouns: string;
  bio: string;
  websiteUrl: string;
  linkedinUrl: string;

  talkTitle: string;
  talkAbstract: string;
  learningObjectives: string;

  sessionFormat: string;
  sessionLength: string;
  sessionTrack: string;
  preferredDay: string;
  coPresenters: string;

  presenterMessage: string;

  headshotDataUrl: string;
  headshotName: string;
};

export const EMPTY_FORM: Form = {
  name: "", email: "", phone: "", affiliation: "", jobTitle: "", pronouns: "",
  bio: "", websiteUrl: "", linkedinUrl: "",
  talkTitle: "", talkAbstract: "", learningObjectives: "",
  sessionFormat: "", sessionLength: "", sessionTrack: "", preferredDay: "",
  coPresenters: "", presenterMessage: "",
  headshotDataUrl: "", headshotName: "",
};

type Action =
  | { type: "set"; key: keyof Form; value: string }
  | { type: "setHeadshot"; dataUrl: string; name: string }
  | { type: "clearHeadshot" }
  | { type: "reset" };

function reducer(state: Form, action: Action): Form {
  switch (action.type) {
    case "set":
      return { ...state, [action.key]: action.value };
    case "setHeadshot":
      return { ...state, headshotDataUrl: action.dataUrl, headshotName: action.name };
    case "clearHeadshot":
      return { ...state, headshotDataUrl: "", headshotName: "" };
    case "reset":
      return EMPTY_FORM;
  }
}

// Required = must be filled to send. Weighted heavier in the completeness meter
// so the bar reflects "have I done the essentials" more than "filled every box".
const REQUIRED: Array<keyof Form> = ["name", "email", "talkTitle", "talkAbstract"];

// Counted optional fields. Each contributes a smaller slice to completeness.
const OPTIONAL_COUNTED: Array<keyof Form> = [
  "affiliation", "jobTitle", "pronouns", "bio",
  "learningObjectives", "sessionFormat", "sessionLength",
  "sessionTrack", "preferredDay", "headshotDataUrl",
];

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

export type ProposalFormApi = {
  form: Form;
  update: (k: keyof Form, v: string) => void;
  setHeadshot: (dataUrl: string, name: string) => void;
  clearHeadshot: () => void;
  reset: () => void;
  completeness: number;
  missing: Array<keyof Form>;
  validate: () => Array<keyof Form>;
  isValid: boolean;
};

export function useProposalForm(): ProposalFormApi {
  const [form, dispatch] = useReducer(reducer, EMPTY_FORM);

  const update = useCallback((key: keyof Form, value: string) => {
    dispatch({ type: "set", key, value });
  }, []);

  const setHeadshot = useCallback((dataUrl: string, name: string) => {
    dispatch({ type: "setHeadshot", dataUrl, name });
  }, []);

  const clearHeadshot = useCallback(() => {
    dispatch({ type: "clearHeadshot" });
  }, []);

  const reset = useCallback(() => dispatch({ type: "reset" }), []);

  // Required fields weigh 3x optional ones in the meter. Email also has to parse.
  const completeness = useMemo(() => {
    const reqWeight = 3;
    const optWeight = 1;
    const totalPossible = REQUIRED.length * reqWeight + OPTIONAL_COUNTED.length * optWeight;
    let acc = 0;
    for (const k of REQUIRED) {
      const v = form[k];
      if (k === "email") {
        if (isEmail(v)) acc += reqWeight;
      } else if (v && v.trim().length > 0) {
        acc += reqWeight;
      }
    }
    for (const k of OPTIONAL_COUNTED) {
      if (form[k] && form[k].trim().length > 0) acc += optWeight;
    }
    return Math.min(100, Math.round((acc / totalPossible) * 100));
  }, [form]);

  const missing = useMemo<Array<keyof Form>>(() => {
    const out: Array<keyof Form> = [];
    for (const k of REQUIRED) {
      const v = form[k];
      if (!v || !v.trim()) out.push(k);
      else if (k === "email" && !isEmail(v)) out.push(k);
    }
    return out;
  }, [form]);

  const validate = useCallback(() => missing, [missing]);
  const isValid = missing.length === 0;

  return {
    form,
    update,
    setHeadshot,
    clearHeadshot,
    reset,
    completeness,
    missing,
    validate,
    isValid,
  };
}
