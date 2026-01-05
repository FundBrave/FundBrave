import Link from "next/link";
import Navbar from "./components/Navbar";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4 text-primary-900 dark:text-white bg:brand-light-100 dark:bg-brand-dark-80">
          Welcome to FundBrave
        </h1>
        <p className="text-lg text-primary-700 dark:text-gray-300">
          A decentralized fundraising platform.
        </p>

        {/* <!-- Add more content here as needed --> */}
        <section className="mt-8 bg-brand-purple">
          <li className=" bg:brand-light-100 dark:bg-brand-dark-800 p-6 rounded-lg shadow-md text-4xl font-semibold text-center block hover:shadow-lg transition-shadow cursor-pointer text-brand-light-100">
            <Link className="m-2" href="/themePage">
              Go to Theme Page
            </Link>
          </li>
        </section>
      </main>
    </>
  );
}
