import { HttpError } from "fresh";
import { define } from "../utils.ts";
import { PageHead } from "../components/PageHead.tsx";

export default define.page(function ErrorPage({ error, url }) {
  const notFound = error instanceof HttpError && error.status === 404;
  return (
    <section class="wrap" style="padding-block: 48px">
      <PageHead title={notFound ? "Not found" : "Error"} description="No such page in this history." url={url} />
      <span class="eyebrow">{notFound ? "404" : "500"}</span>
      <h2 style="font-family: var(--serif); font-weight: 400; font-size: 32px; margin: 6px 0 10px">
        {notFound ? "No such page in this history." : "Something broke."}
      </h2>
      <p class="note">
        {notFound
          ? (
            <>
              Nothing lives at <code>{url.pathname}</code>. Try the language finder above, or head back to the{" "}
              <a href="/">River</a>.
            </>
          )
          : <>The server hit an error rendering this page. Details are in the dev server log.</>}
      </p>
    </section>
  );
});
