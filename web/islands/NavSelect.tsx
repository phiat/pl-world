type Props = {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  /** URL with a {v} placeholder for the chosen value. */
  href: string;
  placeholder?: string;
};

/** A select that navigates on change (the chosen state lives in the URL). */
export default function NavSelect({ label, value, options, href, placeholder }: Props) {
  return (
    <label class="ctl">
      {label}
      <select
        onChange={(e) => {
          const v = e.currentTarget.value;
          if (v) location.assign(href.replace("{v}", encodeURIComponent(v)));
        }}
      >
        {placeholder && <option value="" selected={!value}>{placeholder}</option>}
        {options.map((o) => <option key={o.value} value={o.value} selected={o.value === value}>{o.label}</option>)}
      </select>
    </label>
  );
}
