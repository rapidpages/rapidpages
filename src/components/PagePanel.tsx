import { PageEditor } from "~/components/PageEditor";
import { PageEditor as PageEditorLegacy } from "~/components/PageEditorLegacy";

export const PagePanel = ({
  code,
  legacy,
}: {
  code: string;
  legacy: boolean;
}) => {
  return (
    <>
      <div className="relative flex h-full w-full rounded-b-lg border border-t-0 border-gray-300 bg-gray-200">
        {legacy ? <PageEditorLegacy code={code} /> : <PageEditor code={code} />}
      </div>
    </>
  );
};
