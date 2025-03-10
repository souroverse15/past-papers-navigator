export default function PDFViewer({ file }) {
  if (!file) {
    return <p className="text-center mt-4">Select a paper to view</p>;
  }

  return (
    <div className="w-3/4 flex flex-col items-center p-4">
      <h2 className="text-lg font-bold mb-2">{file.name}</h2>
      <iframe src={file.qp} width="100%" height="600px" allowFullScreen />
    </div>
  );
}
