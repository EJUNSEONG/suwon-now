import Header from "../components/Header";
import Hero from "../components/Hero";
import ThisWeek from "../components/ThisWeek";

function Home() {
  return (
    <>
      <Header />

      <main>
        <Hero />
        <ThisWeek />
      </main>
    </>
  );
}

export default Home;