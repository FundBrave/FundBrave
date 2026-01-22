"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronDown,
  HelpCircle,
  BookOpen,
  Mail,
  MessageSquare,
  ExternalLink,
} from "lucide-react";
import { Navbar } from "@/app/components/common";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface HelpArticle {
  id: string;
  title: string;
  description: string;
  category: string;
  readTime: string;
}

const faqCategories = ["All", "Getting Started", "Donations", "Campaigns", "Staking", "DAO"];

const faqData: FAQItem[] = [
  {
    id: "faq-1",
    question: "What is FundBrave?",
    answer: "FundBrave is a decentralized fundraising platform that combines traditional crowdfunding with DeFi mechanics. It allows campaign creators to raise funds while offering donors innovative ways to contribute through direct donations, wealth-building donations, and staking.",
    category: "Getting Started",
  },
  {
    id: "faq-2",
    question: "How do I create a campaign?",
    answer: "To create a campaign: 1) Connect your wallet, 2) Click 'Create Campaign' in the navigation, 3) Fill out campaign details including title, description, goal amount, and images, 4) Set your fundraising duration, 5) Submit the campaign. Your campaign will be reviewed and published on the platform.",
    category: "Campaigns",
  },
  {
    id: "faq-3",
    question: "What are the three donation models?",
    answer: "FundBrave offers three donation models: 1) Direct Donations - 100% goes to the campaign creator, 2) Wealth-Building Donations - 78% to creator, 20% staked for you, 2% platform fee, 3) Staking Donations - You stake tokens that generate yield, which goes to the campaign over time.",
    category: "Donations",
  },
  {
    id: "faq-4",
    question: "What is FBT token?",
    answer: "FBT (FundBrave Token) is the platform's governance token. Holders can stake FBT to earn yield, participate in DAO governance, and vote on platform decisions like yield allocation and parameter changes.",
    category: "Staking",
  },
  {
    id: "faq-5",
    question: "How does staking work?",
    answer: "FundBrave has three staking pools: 1) Per-campaign pools - Stake to support specific campaigns and earn yield, 2) Global staking pool - Stake across all campaigns for diversified returns, 3) Impact DAO pool - Stake to earn governance voting power and influence platform decisions.",
    category: "Staking",
  },
  {
    id: "faq-6",
    question: "How do I participate in DAO governance?",
    answer: "To participate in governance: 1) Acquire FBT tokens, 2) Stake FBT in the Impact DAO pool to gain voting power, 3) Browse active proposals in the Governance Dashboard, 4) Vote on proposals using your FBT voting power. Your voting power is weighted by your FBT stake.",
    category: "DAO",
  },
  {
    id: "faq-7",
    question: "What wallets are supported?",
    answer: "FundBrave supports all major Ethereum wallets including MetaMask, WalletConnect, Coinbase Wallet, and Rainbow Wallet. Simply click 'Connect Wallet' and choose your preferred wallet provider.",
    category: "Getting Started",
  },
  {
    id: "faq-8",
    question: "Are donations tax-deductible?",
    answer: "Tax deductibility depends on your local jurisdiction and the campaign's non-profit status. FundBrave provides donation receipts with transaction details that you can use for tax purposes. Consult with a tax professional for specific guidance.",
    category: "Donations",
  },
  {
    id: "faq-9",
    question: "How long does it take to receive campaign funds?",
    answer: "For direct donations, funds are available immediately in your connected wallet. For staking-based donations, yield accrues over time and can be claimed periodically. All transactions are recorded on the blockchain for transparency.",
    category: "Campaigns",
  },
  {
    id: "faq-10",
    question: "What fees does FundBrave charge?",
    answer: "FundBrave has minimal fees: Direct donations have a 2% platform fee. Wealth-building donations allocate 2% to the platform. Staking pools have varying APY rates. All fee structures are transparent and displayed before transactions.",
    category: "Getting Started",
  },
];

const helpArticles: HelpArticle[] = [
  {
    id: "article-1",
    title: "Getting Started with FundBrave",
    description: "Learn the basics of creating your first campaign and making your first donation",
    category: "Getting Started",
    readTime: "5 min read",
  },
  {
    id: "article-2",
    title: "Understanding Wealth-Building Donations",
    description: "Deep dive into how the 78/20/2 split works and how it builds wealth for donors",
    category: "Donations",
    readTime: "8 min read",
  },
  {
    id: "article-3",
    title: "Staking Strategy Guide",
    description: "Maximize your returns across campaign, global, and DAO staking pools",
    category: "Staking",
    readTime: "10 min read",
  },
  {
    id: "article-4",
    title: "Campaign Best Practices",
    description: "Tips for creating successful campaigns that reach their funding goals",
    category: "Campaigns",
    readTime: "7 min read",
  },
];

export default function HelpCenterPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const filteredFAQs = faqData.filter((faq) => {
    const matchesSearch =
      searchQuery === "" ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All" || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <HelpCircle className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-3">How can we help?</h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Find answers to common questions and learn how to make the most of FundBrave
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for help..."
              className="w-full pl-12 pr-4 py-4 bg-surface-elevated border border-border-subtle rounded-xl text-foreground placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
            />
          </div>
        </div>

        {/* Quick Help Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <button
            onClick={() => window.open("https://docs.fundbrave.com", "_blank")}
            className="bg-surface-elevated border border-border-subtle hover:border-primary/30 rounded-xl p-6 transition-all text-left group"
          >
            <BookOpen className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
              Documentation
            </h3>
            <p className="text-sm text-text-secondary">
              Comprehensive guides and API documentation
            </p>
            <div className="flex items-center gap-1 text-sm text-primary mt-3">
              <span>Visit Docs</span>
              <ExternalLink className="w-4 h-4" />
            </div>
          </button>

          <button
            onClick={() => router.push("/community")}
            className="bg-surface-elevated border border-border-subtle hover:border-primary/30 rounded-xl p-6 transition-all text-left group"
          >
            <MessageSquare className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
              Community Forum
            </h3>
            <p className="text-sm text-text-secondary">
              Connect with other users and get help from the community
            </p>
            <div className="flex items-center gap-1 text-sm text-primary mt-3">
              <span>Join Discussion</span>
            </div>
          </button>

          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-6">
            <Mail className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-semibold text-foreground mb-2">Contact Support</h3>
            <p className="text-sm text-text-secondary mb-3">
              Need more help? Our team is here for you
            </p>
            <a
              href="mailto:support@fundbrave.com"
              className="text-sm text-primary hover:underline"
            >
              support@fundbrave.com
            </a>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Frequently Asked Questions</h2>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            {faqCategories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  activeCategory === category
                    ? "bg-primary text-white"
                    : "bg-surface-elevated text-text-secondary hover:text-foreground hover:bg-surface-overlay border border-border-subtle"
                )}
              >
                {category}
              </button>
            ))}
          </div>

          {/* FAQ List */}
          <div className="space-y-3">
            {filteredFAQs.length === 0 ? (
              <div className="bg-surface-elevated border border-border-subtle rounded-xl p-12 text-center">
                <Search className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
                <p className="text-text-secondary">
                  No FAQs found matching your search. Try different keywords.
                </p>
              </div>
            ) : (
              filteredFAQs.map((faq) => (
                <div
                  key={faq.id}
                  className="bg-surface-elevated border border-border-subtle rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => toggleFAQ(faq.id)}
                    className="w-full p-6 flex items-center justify-between text-left hover:bg-surface-overlay transition-colors"
                  >
                    <div className="flex-1 pr-4">
                      <h3 className="font-semibold text-foreground mb-1">{faq.question}</h3>
                      <span className="text-xs text-text-tertiary px-2 py-1 bg-surface-sunken rounded-full">
                        {faq.category}
                      </span>
                    </div>
                    <ChevronDown
                      className={cn(
                        "w-5 h-5 text-text-tertiary transition-transform flex-shrink-0",
                        expandedFAQ === faq.id && "rotate-180"
                      )}
                    />
                  </button>
                  {expandedFAQ === faq.id && (
                    <div className="px-6 pb-6 pt-0">
                      <p className="text-text-secondary leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Help Articles */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">Help Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {helpArticles.map((article) => (
              <button
                key={article.id}
                onClick={() => router.push(`/help/articles/${article.id}`)}
                className="bg-surface-elevated border border-border-subtle hover:border-primary/30 rounded-xl p-6 transition-all text-left group"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs text-text-tertiary px-2 py-1 bg-surface-sunken rounded-full">
                    {article.category}
                  </span>
                  <span className="text-xs text-text-tertiary">{article.readTime}</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {article.title}
                </h3>
                <p className="text-sm text-text-secondary">{article.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Still Need Help */}
        <div className="mt-12 bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/30 rounded-xl p-8 text-center">
          <h3 className="text-xl font-bold text-foreground mb-3">Still need help?</h3>
          <p className="text-text-secondary mb-6">
            Can't find what you're looking for? Our support team is ready to assist you.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button onClick={() => window.open("mailto:support@fundbrave.com")}>
              <Mail className="w-4 h-4 mr-2" />
              Email Support
            </Button>
            <Button variant="outline" onClick={() => router.push("/community")}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Ask Community
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
