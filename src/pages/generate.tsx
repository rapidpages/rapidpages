const Generate = () => {
  return (
    <div className="relative">
      <iframe id="sandbox" className="fixed inset-0 w-full h-full" />
      <form
        method="GET"
        action="/g/index.html"
        target="sandbox"
        className="fixed w-full max-w-sm bottom-12 left-1/2 -translate-x-1/2"
      >
        {/*<textarea name="p" aria-label="prompt" className="min-h-[2em] w-full" />*/}
        <input
          type="text"
          name="p"
          aria-label="prompt"
          className="block w-full rounded-2xl px-3 py-2 border-0 bg-gray-800 text-white"
          autoFocus
        />
      </form>
    </div>
  );
};

export default Generate;
