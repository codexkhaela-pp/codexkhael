async function main() {
  const res = await fetch("http://localhost:3000/dump-reading");
  const data = await res.text();
  console.log(data);
}
main();
