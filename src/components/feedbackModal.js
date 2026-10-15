import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useToast,
} from '@chakra-ui/react';

// Set NEXT_PUBLIC_FEEDBACK_URL to a local backend when developing; the prod API only allows boilerclasses.com origins
const FEEDBACK_URL = process.env.NEXT_PUBLIC_FEEDBACK_URL || "https://api.boilerexams.com/v3/boilerclasses/feedback";
// The API limits content by bytes, not characters, so accents and emoji count for more than one
const MAX_CONTENT_BYTES = 4000;

// The API answers 400s with { description }, and 429s with plain text
const getErrorMessage = async (res) => {
  if (res.status === 429) return "You're sending feedback too quickly, please wait a minute and try again.";
  if (res.status === 400) {
    const data = await res.json().catch(() => null);
    if (data?.description) return data.description + ".";
  }
  return "Something went wrong, please try again.";
};

const FeedbackModal = ({ isOpen, onClose }) => {
  const toast = useToast();
  const [content, setContent] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isTooLong = new TextEncoder().encode(content.trim()).length > MAX_CONTENT_BYTES;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(FEEDBACK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, email }),
      });
      if (!res.ok) {
        toast({
          title: await getErrorMessage(res),
          status: "error",
          duration: 3000,
          isClosable: true,
          position: "top"
        });
        return;
      }

      setContent("");
      setEmail("");
      onClose();
      toast({
        title: "Thanks for your feedback!",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top"
      });
    } catch (error) {
      console.error('Error sending feedback:', error);
      toast({
        title: "Something went wrong, please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyles = "w-full px-3 py-2 bg-background-secondary placeholder:text-tertiary text-primary text-sm rounded-md border border-transparent focus:outline-none focus:border-zinc-500";

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={{ base: "full", md: "lg" }} isCentered>
      <ModalOverlay backdropFilter="blur(3px)" />
      <ModalContent
        bg="rgb(var(--background-color))"
        color="rgb(var(--text-color))"
        borderRadius={{ base: "none", md: "xl" }}
        boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.7)"
        mx={{ base: 0, md: 4 }}
      >
        <ModalHeader pb={1}>BoilerClasses Feedback</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <p className='text-tertiary text-sm mb-6'>
            Thanks for visiting our site! Let us know if you find any bugs, suggestions, or improvements!
          </p>
          <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
            <div className='flex flex-col gap-1.5'>
              <label htmlFor='feedback-content' className='text-sm font-medium'>
                Feedback <span className='text-red-500'>*</span>
              </label>
              <textarea
                id='feedback-content'
                required
                rows={5}
                maxLength={MAX_CONTENT_BYTES}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Include the relevant course name, or steps to reproduce if it's a bug"
                className={inputStyles + " resize-none"}
              />
              {isTooLong && (
                <p className='text-red-500 text-xs'>
                  Your feedback is too long, please shorten it.
                </p>
              )}
            </div>
            <div className='flex flex-col gap-1.5'>
              <label htmlFor='feedback-email' className='text-sm font-medium'>
                Email <span className='text-tertiary font-normal'>(optional)</span>
              </label>
              <input
                id='feedback-email'
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="If you'd like us to follow up"
                className={inputStyles}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !content.trim() || isTooLong}
              className="self-end bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white px-6 py-2 rounded-md font-medium text-sm"
            >
              {isSubmitting ? "Sending..." : "Submit"}
            </button>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default FeedbackModal;
