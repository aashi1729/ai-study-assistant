import { ArrowIcon } from "./icons";

const accentStyles = {
  indigo: {
    icon: "bg-indigo-50 text-indigo-600",
    button: "bg-indigo-600 text-white hover:bg-indigo-700",
  },
  sky: {
    icon: "bg-sky-50 text-sky-600",
    button: "bg-sky-600 text-white hover:bg-sky-700",
  },
  amber: {
    icon: "bg-amber-50 text-amber-700",
    button: "bg-amber-500 text-white hover:bg-amber-600",
  },
};

export default function StudyToolCard({ title, description, href, buttonLabel, accent = "indigo", icon }) {
  const styles = accentStyles[accent];

  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <div className={`mb-4 inline-flex w-fit rounded-xl p-3 ${styles.icon}`}>{icon}</div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-slate-500">{description}</p>
      <a
        href={href}
        className={`mt-5 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${styles.button}`}
      >
        {buttonLabel}
        <ArrowIcon />
      </a>
    </article>
  );
}
