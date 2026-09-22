import Header from "../components/Header";
import Hero from "../components/Hero";
import ThisWeek from "../components/ThisWeek";
import ThisMonth from "../components/ThisMonth";

function Home() {
  return (
    <>
      <Header />

      <main>
        <Hero />
        <ThisWeek />
        <ThisMonth />
      </main>
    </>
  );
}

export default Home;