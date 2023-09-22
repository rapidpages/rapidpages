export const LoadingPage = () => {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-20 w-20 animate-spin">
        <div
          className="h-full w-full rounded-[50%] border-4
           border-b-blue-500 border-t-blue-500"
        ></div>
      </div>
    </div>
  );
};
