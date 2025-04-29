import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle,
  BookOpen,
  Clock,
  Filter,
  Search,
  Layers,
  Award,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Info,
  FileText,
  CheckCircle,
  RotateCcw,
  Settings,
  User,
  Target,
  CheckSquare,
  Calendar,
} from "lucide-react";

export default function HelpSupport() {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  const helpCards = [
    {
      title: "Getting Started",
      icon: <BookOpen className="text-blue-400" size={24} />,
      content: (
        <>
          <p className="mb-3">
            Welcome to Past Papers Navigator! Here's how to get started:
          </p>
          <ul className="space-y-2">
            <li className="flex items-start">
              <CheckCircle
                size={16}
                className="text-green-400 mt-1 mr-2 flex-shrink-0"
              />
              <span>
                Browse past papers by exam board and subject in the File
                Navigator
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle
                size={16}
                className="text-green-400 mt-1 mr-2 flex-shrink-0"
              />
              <span>
                View papers and mark schemes side by side in the Paper Viewer
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle
                size={16}
                className="text-green-400 mt-1 mr-2 flex-shrink-0"
              />
              <span>Use the Timer for timed mock exams</span>
            </li>
            <li className="flex items-start">
              <CheckCircle
                size={16}
                className="text-green-400 mt-1 mr-2 flex-shrink-0"
              />
              <span>Track your progress in the User Dashboard</span>
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "Study Goals Feature",
      icon: <Target className="text-blue-400" size={24} />,
      content: (
        <>
          <p className="mb-3">
            The Study Goals feature helps you plan and track your exam
            preparation:
          </p>
          <ul className="space-y-2">
            <li className="flex items-start">
              <CheckCircle
                size={16}
                className="text-green-400 mt-1 mr-2 flex-shrink-0"
              />
              <span>
                <strong>Adding Individual Papers</strong>: Click "Add to Goals"
                when viewing a paper
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle
                size={16}
                className="text-green-400 mt-1 mr-2 flex-shrink-0"
              />
              <span>
                <strong>Batch Adding Papers</strong>: Use checkboxes in the file
                navigator to select multiple papers at once (sign-in required)
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle
                size={16}
                className="text-green-400 mt-1 mr-2 flex-shrink-0"
              />
              <span>
                <strong>Efficient Selection</strong>: Click checkboxes next to
                year folders (e.g., 2019) or session folders (e.g., May-June) to
                select all papers within
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle
                size={16}
                className="text-green-400 mt-1 mr-2 flex-shrink-0"
              />
              <span>
                <strong>Adding Selected Papers</strong>: After selecting papers,
                click the "Add to Goals" button that appears at the top of the
                file navigator
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle
                size={16}
                className="text-green-400 mt-1 mr-2 flex-shrink-0"
              />
              <span>
                <strong>Setting Deadlines</strong>: Set target dates for each
                paper in your dashboard to schedule your study
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle
                size={16}
                className="text-green-400 mt-1 mr-2 flex-shrink-0"
              />
              <span>
                <strong>Tracking Completion</strong>: Papers are automatically
                marked as complete when you finish a mock exam
              </span>
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "Using the Timer",
      icon: <Clock className="text-blue-400" size={24} />,
      content: (
        <>
          <p className="mb-3">
            The Timer helps you practice under exam conditions:
          </p>
          <ul className="space-y-2">
            <li className="flex items-start">
              <CheckCircle
                size={16}
                className="text-green-400 mt-1 mr-2 flex-shrink-0"
              />
              <span>Click the Timer button when viewing a paper</span>
            </li>
            <li className="flex items-start">
              <CheckCircle
                size={16}
                className="text-green-400 mt-1 mr-2 flex-shrink-0"
              />
              <span>Set your desired time or use the recommended duration</span>
            </li>
            <li className="flex items-start">
              <CheckCircle
                size={16}
                className="text-green-400 mt-1 mr-2 flex-shrink-0"
              />
              <span>Press Start to begin your timed session</span>
            </li>
            <li className="flex items-start">
              <CheckCircle
                size={16}
                className="text-green-400 mt-1 mr-2 flex-shrink-0"
              />
              <span>
                Press ESC or End Exam to finish and save your progress
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle
                size={16}
                className="text-green-400 mt-1 mr-2 flex-shrink-0"
              />
              <span>Record your score to track improvement over time</span>
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "Navigation Tips",
      icon: <Search className="text-blue-400" size={24} />,
      content: (
        <>
          <p className="mb-3">Find the papers you need quickly:</p>
          <ul className="space-y-2">
            <li className="flex items-start">
              <CheckCircle
                size={16}
                className="text-green-400 mt-1 mr-2 flex-shrink-0"
              />
              <span>Use the search bar to find specific papers by keyword</span>
            </li>
            <li className="flex items-start">
              <CheckCircle
                size={16}
                className="text-green-400 mt-1 mr-2 flex-shrink-0"
              />
              <span>
                Enable subject filtering to show only your preferred subjects
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle
                size={16}
                className="text-green-400 mt-1 mr-2 flex-shrink-0"
              />
              <span>
                Browse by year to find papers from specific exam sessions
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle
                size={16}
                className="text-green-400 mt-1 mr-2 flex-shrink-0"
              />
              <span>
                Click folder icons to expand/collapse file directories
              </span>
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "Subject Filtering",
      icon: <Filter className="text-blue-400" size={24} />,
      content: (
        <>
          <p className="mb-3">Personalize your paper browsing experience:</p>
          <ul className="space-y-2">
            <li className="flex items-start">
              <CheckCircle
                size={16}
                className="text-green-400 mt-1 mr-2 flex-shrink-0"
              />
              <span>Go to the Preferences tab in your User Dashboard</span>
            </li>
            <li className="flex items-start">
              <CheckCircle
                size={16}
                className="text-green-400 mt-1 mr-2 flex-shrink-0"
              />
              <span>Select the subjects you're interested in</span>
            </li>
            <li className="flex items-start">
              <CheckCircle
                size={16}
                className="text-green-400 mt-1 mr-2 flex-shrink-0"
              />
              <span>
                Click the filter button in the File Navigator to toggle
                filtering
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle
                size={16}
                className="text-green-400 mt-1 mr-2 flex-shrink-0"
              />
              <span>
                Hover over the filter button to see which subjects are active
              </span>
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "View Modes",
      icon: <Layers className="text-blue-400" size={24} />,
      content: (
        <>
          <p className="mb-3">Different ways to view your papers:</p>
          <ul className="space-y-2">
            <li className="flex items-start">
              <CheckCircle
                size={16}
                className="text-green-400 mt-1 mr-2 flex-shrink-0"
              />
              <span>Question Paper view: Shows only the selected paper</span>
            </li>
            <li className="flex items-start">
              <CheckCircle
                size={16}
                className="text-green-400 mt-1 mr-2 flex-shrink-0"
              />
              <span>
                Side-by-side view: Shows question paper and mark scheme together
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle
                size={16}
                className="text-green-400 mt-1 mr-2 flex-shrink-0"
              />
              <span>
                On mobile, use the drag handle to resize the split view
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle
                size={16}
                className="text-green-400 mt-1 mr-2 flex-shrink-0"
              />
              <span>
                Toggle between tabs to view different materials for the same
                paper
              </span>
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "Performance Analytics",
      icon: <Award className="text-blue-400" size={24} />,
      content: (
        <>
          <p className="mb-3">
            Track your progress and identify areas for improvement:
          </p>
          <ul className="space-y-2">
            <li className="flex items-start">
              <CheckCircle
                size={16}
                className="text-green-400 mt-1 mr-2 flex-shrink-0"
              />
              <span>Visit the Performance tab in your User Dashboard</span>
            </li>
            <li className="flex items-start">
              <CheckCircle
                size={16}
                className="text-green-400 mt-1 mr-2 flex-shrink-0"
              />
              <span>
                Filter by subject and unit/paper to analyze specific areas
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle
                size={16}
                className="text-green-400 mt-1 mr-2 flex-shrink-0"
              />
              <span>Review your score trends and time spent on exams</span>
            </li>
            <li className="flex items-start">
              <CheckCircle
                size={16}
                className="text-green-400 mt-1 mr-2 flex-shrink-0"
              />
              <span>
                Read personalized performance analysis based on your results
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle
                size={16}
                className="text-green-400 mt-1 mr-2 flex-shrink-0"
              />
              <span>Use insights to focus your study on weaker areas</span>
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "Mock Exam History",
      icon: <FileText className="text-blue-400" size={24} />,
      content: (
        <>
          <p className="mb-3">Review your mock exam history:</p>
          <ul className="space-y-2">
            <li className="flex items-start">
              <CheckCircle
                size={16}
                className="text-green-400 mt-1 mr-2 flex-shrink-0"
              />
              <span>Go to the Mock History tab in your User Dashboard</span>
            </li>
            <li className="flex items-start">
              <CheckCircle
                size={16}
                className="text-green-400 mt-1 mr-2 flex-shrink-0"
              />
              <span>View a list of all your completed mock exams</span>
            </li>
            <li className="flex items-start">
              <CheckCircle
                size={16}
                className="text-green-400 mt-1 mr-2 flex-shrink-0"
              />
              <span>Check dates, paper details, duration, and scores</span>
            </li>
            <li className="flex items-start">
              <CheckCircle
                size={16}
                className="text-green-400 mt-1 mr-2 flex-shrink-0"
              />
              <span>
                Use the refresh button to update with your latest attempts
              </span>
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "Account Settings",
      icon: <User className="text-blue-400" size={24} />,
      content: (
        <>
          <p className="mb-3">Manage your account and preferences:</p>
          <ul className="space-y-2">
            <li className="flex items-start">
              <CheckCircle
                size={16}
                className="text-green-400 mt-1 mr-2 flex-shrink-0"
              />
              <span>
                Your profile information is shown at the top of your dashboard
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle
                size={16}
                className="text-green-400 mt-1 mr-2 flex-shrink-0"
              />
              <span>
                Update your subject preferences in the Preferences tab
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle
                size={16}
                className="text-green-400 mt-1 mr-2 flex-shrink-0"
              />
              <span>Choose between dark and light theme (coming soon)</span>
            </li>
            <li className="flex items-start">
              <CheckCircle
                size={16}
                className="text-green-400 mt-1 mr-2 flex-shrink-0"
              />
              <span>Sign out when you're finished to protect your account</span>
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "Best Practices",
      icon: <Lightbulb className="text-yellow-400" size={24} />,
      content: (
        <>
          <p className="mb-3">Tips to maximize your exam preparation:</p>
          <ul className="space-y-2">
            <li className="flex items-start">
              <CheckCircle
                size={16}
                className="text-green-400 mt-1 mr-2 flex-shrink-0"
              />
              <span>
                Practice with the timer to build exam stamina and time
                management
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle
                size={16}
                className="text-green-400 mt-1 mr-2 flex-shrink-0"
              />
              <span>Complete full papers rather than individual questions</span>
            </li>
            <li className="flex items-start">
              <CheckCircle
                size={16}
                className="text-green-400 mt-1 mr-2 flex-shrink-0"
              />
              <span>Track your scores to monitor progress over time</span>
            </li>
            <li className="flex items-start">
              <CheckCircle
                size={16}
                className="text-green-400 mt-1 mr-2 flex-shrink-0"
              />
              <span>
                Focus on recent papers (last 5 years) for most relevant practice
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle
                size={16}
                className="text-green-400 mt-1 mr-2 flex-shrink-0"
              />
              <span>
                Review mark schemes thoroughly to understand examiner
                expectations
              </span>
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "Troubleshooting",
      icon: <RotateCcw className="text-red-400" size={24} />,
      content: (
        <>
          <p className="mb-3">Common issues and their solutions:</p>
          <ul className="space-y-2">
            <li className="flex items-start">
              <CheckCircle
                size={16}
                className="text-green-400 mt-1 mr-2 flex-shrink-0"
              />
              <span>If papers don't load, try refreshing your browser</span>
            </li>
            <li className="flex items-start">
              <CheckCircle
                size={16}
                className="text-green-400 mt-1 mr-2 flex-shrink-0"
              />
              <span>Make sure you're signed in to save mock exam data</span>
            </li>
            <li className="flex items-start">
              <CheckCircle
                size={16}
                className="text-green-400 mt-1 mr-2 flex-shrink-0"
              />
              <span>
                If mock exam history doesn't update, use the refresh button
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle
                size={16}
                className="text-green-400 mt-1 mr-2 flex-shrink-0"
              />
              <span>
                Clear your browser cache if filtering doesn't work correctly
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle
                size={16}
                className="text-green-400 mt-1 mr-2 flex-shrink-0"
              />
              <span>
                Contact support if issues persist (support link coming soon)
              </span>
            </li>
          </ul>
        </>
      ),
    },
  ];

  const nextCard = () => {
    setCurrentCardIndex((prevIndex) =>
      prevIndex === helpCards.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevCard = () => {
    setCurrentCardIndex((prevIndex) =>
      prevIndex === 0 ? helpCards.length - 1 : prevIndex - 1
    );
  };

  const goToCard = (index) => {
    setCurrentCardIndex(index);
  };

  return (
    <div className="p-6 bg-gradient-to-br from-gray-900 to-gray-950 text-white min-h-screen">
      {/* Header */}
      <div className="mb-8 p-5 bg-gray-800/40 backdrop-blur-md border border-gray-700/50 rounded-xl">
        <h1 className="text-2xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 flex items-center">
          <HelpCircle className="mr-2 text-blue-400" size={28} />
          Help & Support
        </h1>
        <p className="text-gray-300">
          Learn how to get the most out of Past Papers Navigator with these
          helpful tips and guides.
        </p>
      </div>

      {/* Flashcards */}
      <div className="mb-8 relative">
        <div className="absolute -left-4 top-1/2 transform -translate-y-1/2 z-10">
          <button
            onClick={prevCard}
            className="p-2 rounded-full bg-gray-800/60 border border-gray-700/50 backdrop-blur-sm hover:bg-gray-700/60 transition-colors group"
          >
            <ChevronLeft
              className="text-gray-400 group-hover:text-white transition-colors"
              size={24}
            />
          </button>
        </div>

        <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 z-10">
          <button
            onClick={nextCard}
            className="p-2 rounded-full bg-gray-800/60 border border-gray-700/50 backdrop-blur-sm hover:bg-gray-700/60 transition-colors group"
          >
            <ChevronRight
              className="text-gray-400 group-hover:text-white transition-colors"
              size={24}
            />
          </button>
        </div>

        <div className="min-h-[400px] bg-gray-800/40 backdrop-blur-md border border-gray-700/50 rounded-xl p-6 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentCardIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-full bg-gray-700/50 border border-gray-600/50 mr-3">
                  {helpCards[currentCardIndex].icon}
                </div>
                <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                  {helpCards[currentCardIndex].title}
                </h2>
              </div>
              <div className="text-gray-300 prose-sm prose-invert">
                {helpCards[currentCardIndex].content}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Card navigation dots */}
      <div className="flex justify-center space-x-2 mb-8">
        {helpCards.map((_, index) => (
          <button
            key={index}
            onClick={() => goToCard(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              index === currentCardIndex
                ? "bg-blue-500 w-6"
                : "bg-gray-600 hover:bg-gray-500"
            }`}
            aria-label={`Go to card ${index + 1}`}
          />
        ))}
      </div>

      {/* Additional Tips Section */}
      <div className="bg-gray-800/40 backdrop-blur-md border border-gray-700/50 rounded-xl p-5 mb-8">
        <div className="flex items-center mb-4">
          <Info className="text-blue-400 mr-2" size={24} />
          <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Quick Tips
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-700/30 backdrop-blur-sm border border-gray-600/30 rounded-lg p-4">
            <h3 className="font-medium text-blue-400 mb-2">
              Keyboard Shortcuts
            </h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li className="flex justify-between">
                <span>ESC</span>
                <span className="text-gray-400">End exam / Close modals</span>
              </li>
              <li className="flex justify-between">
                <span>Ctrl + F</span>
                <span className="text-gray-400">Find in document</span>
              </li>
              <li className="flex justify-between">
                <span>Arrow keys</span>
                <span className="text-gray-400">Navigate pages</span>
              </li>
              <li className="flex justify-between">
                <span>Spacebar</span>
                <span className="text-gray-400">Play/pause timer</span>
              </li>
            </ul>
          </div>
          <div className="bg-gray-700/30 backdrop-blur-sm border border-gray-600/30 rounded-lg p-4">
            <h3 className="font-medium text-blue-400 mb-2">Study Tips</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li className="flex justify-between">
                <span>Consistent practice</span>
                <span className="text-gray-400">2-3 papers weekly</span>
              </li>
              <li className="flex justify-between">
                <span>Focus on weak areas</span>
                <span className="text-gray-400">Track by subject/unit</span>
              </li>
              <li className="flex justify-between">
                <span>Spaced repetition</span>
                <span className="text-gray-400">Review past mistakes</span>
              </li>
              <li className="flex justify-between">
                <span>Active learning</span>
                <span className="text-gray-400">Explain concepts aloud</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-gray-800/40 backdrop-blur-md border border-gray-700/50 rounded-xl p-5">
        <div className="flex items-center mb-4">
          <HelpCircle className="text-blue-400 mr-2" size={24} />
          <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Frequently Asked Questions
          </h2>
        </div>
        <div className="space-y-4">
          <div className="bg-gray-700/30 backdrop-blur-sm border border-gray-600/30 rounded-lg p-4">
            <h3 className="font-medium text-blue-400 mb-2">
              How do I use the Study Goals feature?
            </h3>
            <p className="text-gray-300 text-sm">
              Study Goals help you organize your exam preparation. You can add
              papers individually by clicking "Add to Goals" in the Paper
              Viewer, or add multiple papers at once using the checkboxes in the
              File Navigator. You need to be signed in to use this feature. Year
              and session folder checkboxes let you quickly select all related
              papers. After completing a mock exam, papers are automatically
              marked as complete in your goals.
            </p>
          </div>
          <div className="bg-gray-700/30 backdrop-blur-sm border border-gray-600/30 rounded-lg p-4">
            <h3 className="font-medium text-blue-400 mb-2">
              Do I need to create an account?
            </h3>
            <p className="text-gray-300 text-sm">
              Yes, creating an account allows you to save your mock exam
              history, track your progress, and set subject preferences. All
              these features enhance your study experience.
            </p>
          </div>
          <div className="bg-gray-700/30 backdrop-blur-sm border border-gray-600/30 rounded-lg p-4">
            <h3 className="font-medium text-blue-400 mb-2">
              How do I track my progress?
            </h3>
            <p className="text-gray-300 text-sm">
              Use the Timer feature when practicing with past papers and record
              your scores. Visit your User Dashboard to view performance
              analytics and track your improvement over time.
            </p>
          </div>
          <div className="bg-gray-700/30 backdrop-blur-sm border border-gray-600/30 rounded-lg p-4">
            <h3 className="font-medium text-blue-400 mb-2">
              Can I view papers offline?
            </h3>
            <p className="text-gray-300 text-sm">
              Currently, an internet connection is required to view papers.
              We're working on an offline mode that will be available in a
              future update.
            </p>
          </div>
          <div className="bg-gray-700/30 backdrop-blur-sm border border-gray-600/30 rounded-lg p-4">
            <h3 className="font-medium text-blue-400 mb-2">
              How often are new papers added?
            </h3>
            <p className="text-gray-300 text-sm">
              New papers are added shortly after each exam session. We typically
              update our database within 1-2 weeks of official papers being
              released.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
