"use client";
import React, { useState } from 'react';
import Footer from '@/components/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp, slideIn, staggerContainer } from '@/lib/motion';
import { submitContact, isApiConnectionError } from '@/lib/api';
import type { ContactPayload } from '@/lib/api';
import {
  FaFacebookF,
  FaEnvelope,
  FaGlobe,
  FaInstagram,
  FaLinkedinIn,
  FaLocationDot,
  FaPhoneVolume,
  FaPaperPlane,
  FaWhatsapp,
  FaXTwitter,
  FaYoutube,
} from 'react-icons/fa6';

// ── Constants ──────────────────────────────────────────────────────────

/** Initial (empty) form state — reused on reset after successful submission */
const INITIAL_FORM: ContactPayload = {
  firstName: '',
  lastName: '',
  email: '',
  message: '',
};

/** Standard email regex for client-side validation */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Component ──────────────────────────────────────────────────────────

const ContactSection = () => {
  // ── Form state ─────────────────────────────────────────────────────
  const [formData, setFormData] = useState<ContactPayload>(INITIAL_FORM);

  // ── Inline field-level error messages ──────────────────────────────
  const [errors, setErrors] = useState({
    email: '',
    firstName: '',
    lastName: '',
  });

  // ── Submission lifecycle states ────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [submitError, setSubmitError] = useState('');

  // ── Static data ────────────────────────────────────────────────────
  const socialLinks = [
    { icon: FaFacebookF, color: 'text-[#1877F2]', label: 'Facebook', url: 'https://www.facebook.com/thestackly/' },
    { icon: FaYoutube, color: 'text-[#FF0000]', label: 'YouTube', url: 'https://www.youtube.com/@TheStackly' },
    { icon: FaInstagram, color: 'text-[#E4405F]', label: 'Instagram', url: 'https://www.instagram.com/the_stackly' },
    { icon: FaLinkedinIn, color: 'text-[#0A66C2]', label: 'LinkedIn', url: 'https://in.linkedin.com/company/the-stackly' },
    { icon: FaXTwitter, color: 'text-black', label: 'X', url: 'https://x.com/The_Stackly' },
    { icon: FaGlobe, color: 'text-[#06224C]', label: 'Website', url: 'https://www.thestackly.com/' },
  ];

  // ── Handlers ───────────────────────────────────────────────────────

  /** Live input change handler with inline validation for names and email */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Clear any previous submit-level messages when the user starts editing
    if (successMessage) setSuccessMessage('');
    if (submitError) setSubmitError('');

    // Name Validation: Only allow letters
    if (name === 'firstName' || name === 'lastName') {
      const onlyLetters = value.replace(/[^A-Za-z]/g, '');
      setFormData({ ...formData, [name]: onlyLetters });
      return;
    }

    setFormData({ ...formData, [name]: value });

    // Live Email Validation
    if (name === 'email') {
      if (value && !EMAIL_REGEX.test(value)) {
        setErrors({ ...errors, email: 'Please type in valid format (e.g: ranade@gmail.com)' });
      } else {
        setErrors({ ...errors, email: '' });
      }
    }
  };

  /**
   * Validates every field before submission.
   * Returns `true` when the form is valid; sets `submitError` otherwise.
   */
  const validateForm = (): boolean => {
    // Step 4: All required fields must be filled
    const { firstName, lastName, email, message } = formData;
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !message.trim()) {
      setSubmitError('All fields are required');
      return false;
    }

    // Step 5: Email format check
    if (!EMAIL_REGEX.test(email)) {
      setSubmitError('Please enter a valid email address.');
      return false;
    }

    // Also bail out if there is still an inline email error visible
    if (errors.email) {
      return false;
    }

    return true;
  };

  /**
   * Form submission handler.
   * Validates → calls the backend → handles success / error / network issues.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Step 12: Prevent duplicate submissions while a request is in-flight
    if (isLoading) return;

    // Clear previous messages
    setSuccessMessage('');
    setSubmitError('');

    // Client-side validation (Steps 4 & 5)
    if (!validateForm()) return;

    // Step 7: Enter loading state
    setIsLoading(true);

    try {
      // Step 6: Call POST /api/contact via the reusable API helper
      const response = await submitContact(formData);

      // Step 8: On success — show message and reset the form
      setSuccessMessage(response.message || 'Contact submitted successfully');
      setFormData(INITIAL_FORM);
      setErrors({ email: '', firstName: '', lastName: '' });
    } catch (error: unknown) {
      // Step 11: Network / connection errors
      if (isApiConnectionError(error)) {
        setSubmitError('Unable to connect to server. Please check your internet connection and try again.');
      } else if (error instanceof Error) {
        // Steps 9 & 10: Backend validation (400) or server errors (500)
        // The apiRequest helper already extracts `message` from the response body.
        setSubmitError(error.message || 'Something went wrong. Please try again later.');
      } else {
        setSubmitError('An unexpected error occurred. Please try again later.');
      }
    } finally {
      // Step 7 (cleanup): Always exit loading state
      setIsLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <main className="site-page flex min-h-screen flex-col bg-[#FFF1F2]">
      <motion.section
        id="contact"
        className="relative w-full overflow-hidden px-2 py-8 sm:px-8 md:py-14 lg:px-14"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl"
          animate={{ scale: [1, 1.12, 1], opacity: [0.25, 0.5, 0.25] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-10 lg:flex-row lg:gap-16">

          {/* LEFT COLUMN: Contact Information */}
          <motion.div className="flex w-full flex-col justify-center space-y-8 lg:w-5/12" variants={staggerContainer}>
            <motion.div className="space-y-4" variants={fadeUp}>
              <div className="flex items-center gap-2 text-[#06224C] font-black">
                <FaPhoneVolume className="text-xl" aria-hidden="true" />
                <span className="uppercase tracking-[0.2em] text-xs">Contact</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#06224C] leading-[1.1] tracking-tight">
                Let&apos;s Get In Touch.
              </h2>
              <p className="text-gray-600 text-base sm:text-lg font-medium">
                Or simply reach out directly to
              </p>
            </motion.div>

            <motion.div className="space-y-6" variants={staggerContainer}>
              {/* Email Detail */}
              <motion.div className="flex items-center gap-4" variants={fadeUp} whileHover={{ x: 6 }}>
                <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                  <FaEnvelope className="text-[#EA4335] text-2xl" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Email</p>
                  <p className="text-[#06224C] font-bold text-sm truncate">thestackly@gmail.com</p>
                </div>
              </motion.div>

              {/* Location Detail */}
              <motion.div className="flex items-start gap-4" variants={fadeUp} whileHover={{ x: 6 }}>
                <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                  <FaLocationDot className="text-[#EA4335] text-2xl" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Location</p>
                  <p className="text-[#06224C] font-bold text-xs sm:text-sm leading-relaxed max-w-[300px]">
                    MMR Complex, Chinna Thirupathi, Salem, Tamil Nadu 636008.
                  </p>
                </div>
              </motion.div>

              {/* WhatsApp Detail */}
              <motion.div className="flex items-center gap-4" variants={fadeUp} whileHover={{ x: 6 }}>
                <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                  <FaWhatsapp className="text-[#25D366] text-2xl" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Whatsapp</p>
                  <p className="text-[#06224C] font-bold text-sm">+91 7010792745</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Social Links */}
            <motion.div className="pt-4" variants={fadeUp}>
              <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-4">Social Media hereby :</p>
              <div className="flex flex-wrap gap-3">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <motion.a key={social.label} href={social.url} target="_blank" rel="noopener noreferrer" aria-label={social.label}
                      className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white shadow-md flex items-center justify-center hover:scale-110 transition-all border border-gray-100">
                      <Icon className={`${social.color} text-lg`} aria-hidden="true" />
                    </motion.a>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>

          {/* RIGHT COLUMN: Form Card */}
          <motion.div
            className="relative z-10 w-full rounded-[2.5rem] border border-white bg-white p-6 shadow-2xl sm:p-10 md:p-12 lg:w-7/12"
            variants={slideIn}
            whileHover={{ y: -5, boxShadow: "0 30px 70px rgba(6,34,76,0.16)" }}
            transition={{ duration: 0.25 }}
          >
            <h3 className="text-2xl sm:text-3xl font-black text-[#06224C] mb-1">Send a Message</h3>
            <p className="text-xs sm:text-sm text-gray-400 font-bold mb-8 uppercase tracking-wide">we will get back to you within 48 hours.</p>

            {/* ── Success / Error banners ──────────────────────────────── */}
            <AnimatePresence mode="wait">
              {successMessage && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700"
                  role="status"
                >
                  {successMessage}
                </motion.div>
              )}
              {submitError && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600"
                  role="alert"
                >
                  {submitError}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-[#06224C] uppercase tracking-widest">First Name <span className="text-red-500 font-bold">*</span></label>
                  <input name="firstName" type="text" value={formData.firstName} onChange={handleInputChange} placeholder="First Name" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:bg-white outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-[#06224C] uppercase tracking-widest">Last Name <span className="text-red-500 font-bold">*</span></label>
                  <input name="lastName" type="text" value={formData.lastName} onChange={handleInputChange} placeholder="Last Name" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:bg-white outline-none transition-all" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-[#06224C] uppercase tracking-widest">Email Address <span className="text-red-500 font-bold">*</span></label>
                <input name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="test@gmail.com" required className={`w-full bg-gray-50 border ${errors.email ? 'border-red-500' : 'border-gray-200'} rounded-xl px-4 py-3 text-sm focus:border-blue-400 focus:bg-white outline-none transition-all`} />
                {errors.email && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.email}</p>}
              </div>


              <div className="space-y-2">
                <label className="block text-[10px] font-black text-[#06224C] uppercase tracking-widest">Message <span className="text-red-500 font-bold">*</span></label>
                <textarea name="message" rows={4} value={formData.message} onChange={handleInputChange} placeholder="Tell me about your project..." required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-sm focus:border-blue-400 focus:bg-white outline-none resize-none transition-all"></textarea>
              </div>

              {/* Submit button — shows loading state & is disabled while request is in-flight */}
              <motion.button
                type="submit"
                disabled={isLoading}
                className={`w-full bg-[#06224C] text-white py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-lg ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-900'}`}
                whileHover={isLoading ? {} : { scale: 1.02 }}
                whileTap={isLoading ? {} : { scale: 0.98 }}
              >
                {isLoading ? (
                  <>Sending...</>
                ) : (
                  <>Send Message <FaPaperPlane className="text-[10px]" aria-hidden="true" /></>
                )}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </motion.section>
      <Footer />
    </main>
  );
};

export default ContactSection
