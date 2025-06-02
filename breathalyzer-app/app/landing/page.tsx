'use client';

import { FaChartLine, FaGamepad, FaMobileAlt, FaCheck, FaTwitter, FaLinkedin, FaGithub } from 'react-icons/fa';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <header className="min-h-screen bg-gradient-to-r from-green-600 to-green-800 text-white flex flex-col">
        <nav className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">BreathBuddy</div>
            <div className="hidden md:flex space-x-8">
              <a href="#features" className="hover:text-green-200">Features</a>
              <a href="#how-it-works" className="hover:text-green-200">How It Works</a>
              <a href="#contact" className="hover:text-green-200">Contact</a>
            </div>
          </div>
        </nav>
        <div className="flex-1 flex items-center justify-center">
          <div className="container mx-auto px-6 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-8">Track Your Dental Health with Confidence</h1>
            <p className="text-xl md:text-2xl mb-12">The world's first gamified bad breath detector that makes oral hygiene fun!</p>
            <a href="#features" className="bg-white text-green-600 px-8 py-3 rounded-full font-semibold hover:bg-green-50 transition duration-300">Learn More</a>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="min-h-screen py-20 flex items-center">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16">Key Features</h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <div className="text-green-600 text-4xl mb-4">
                <FaChartLine />
              </div>
              <h3 className="text-xl font-semibold mb-4">Smart Detection</h3>
              <p className="text-gray-600">Advanced sensors measure VOC levels and oral health indicators with professional-grade accuracy.</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <div className="text-green-600 text-4xl mb-4">
                <FaGamepad />
              </div>
              <h3 className="text-xl font-semibold mb-4">Gamified Experience</h3>
              <p className="text-gray-600">Earn points, unlock achievements, and track your progress as you maintain fresh breath.</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <div className="text-green-600 text-4xl mb-4">
                <FaMobileAlt />
              </div>
              <h3 className="text-xl font-semibold mb-4">Easy to Use</h3>
              <p className="text-gray-600">One-button operation with friendly audio feedback makes checking your breath a breeze.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="min-h-screen py-20 bg-gray-100 flex items-center">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16">How It Works</h2>
          <div className="max-w-3xl mx-auto">
            <div className="flex items-start mb-12">
              <div className="bg-green-600 text-white rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0 mr-4">1</div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Press the Button</h3>
                <p className="text-gray-600">Simply press the button on your BreathBuddy to start a breath analysis cycle.</p>
              </div>
            </div>
            <div className="flex items-start mb-12">
              <div className="bg-green-600 text-white rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0 mr-4">2</div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Quick Analysis</h3>
                <p className="text-gray-600">A fun 3-2-1 countdown with friendly beeps precedes a 10-second breath analysis.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-green-600 text-white rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0 mr-4">3</div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Get Your Score</h3>
                <p className="text-gray-600">Receive your breath score and earn points for maintaining fresh breath over time.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Specifications */}
      <section className="min-h-screen py-20 flex items-center">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16">Technical Specifications</h2>
          <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Hardware</h3>
              <ul className="space-y-2 text-gray-600">
                <li><FaCheck className="inline text-green-500 mr-2" />ESP32 Microcontroller</li>
                <li><FaCheck className="inline text-green-500 mr-2" />BME680 VOC Sensor</li>
                <li><FaCheck className="inline text-green-500 mr-2" />BSEC Library Integration</li>
                <li><FaCheck className="inline text-green-500 mr-2" />Wi-Fi Connectivity</li>
              </ul>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Software</h3>
              <ul className="space-y-2 text-gray-600">
                <li><FaCheck className="inline text-green-500 mr-2" />Real-time Breath Analysis</li>
                <li><FaCheck className="inline text-green-500 mr-2" />Gamification System</li>
                <li><FaCheck className="inline text-green-500 mr-2" />Progress Tracking</li>
                <li><FaCheck className="inline text-green-500 mr-2" />Mobile App Integration</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="min-h-screen py-20 bg-gray-100 flex items-center">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16">Get in Touch</h2>
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-gray-600 mb-8">Interested in learning more about BreathBuddy? Contact us for detailed information and partnership opportunities.</p>
            <a href="mailto:contact@breathbuddy.com" className="bg-green-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-green-700 transition duration-300 inline-block">Contact Us</a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-8 md:mb-0">
              <h3 className="text-2xl font-bold">BreathBuddy</h3>
              <p className="text-gray-400 mt-2">Your Personal Bad Breath Detector</p>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-white"><FaTwitter /></a>
              <a href="#" className="text-gray-400 hover:text-white"><FaLinkedin /></a>
              <a href="#" className="text-gray-400 hover:text-white"><FaGithub /></a>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 BreathBuddy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 