import { useState, useEffect } from "react";
import type { FormEvent, MouseEvent, ChangeEvent } from "react";
import { Box, Typography, Paper, Stack } from "@mui/material";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { HiOutlinePlus } from "react-icons/hi";
import { FaPlus } from "react-icons/fa";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from "~/components/ui/dialog";
import { Progress } from "~/components/ui/progress";

export default function VotingComponent({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  interface Vote {
    option: string;
    votes: number;
    color: string;
  }
  const [options, setOptions] = useState<Vote[]>([]);
  const [newOption, setNewOption] = useState("");
  const [isVoteStarted, setIsVoteStarted] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const generateRandomColor = () => {
    return (
      "bg-" +
      "[" +
      "#" +
      Math.floor(Math.random() * 16777215).toString(16) +
      "]"
    );
  };

  const handleAddOption = () => {
    if (
      newOption.trim() &&
      !options.some((o) => o.option === newOption.trim())
    ) {
      setOptions([
        ...options,
        { option: newOption.trim(), votes: 0, color: generateRandomColor() },
      ]);
      setNewOption("");
    }
  };

  const getVotesPercentage = (option: Vote) => {
    const totalVotes = options.reduce((acc, curr) => acc + curr.votes, 0);
    return Math.round((option.votes / totalVotes) * 100);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleSubmitVote = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isVoteStarted) {
      // TODO: stop vote
      // TODO: display the highest voted option
      console.log(
        "Highest voted option:",
        options.reduce((prev, current) =>
          prev.votes > current.votes ? prev : current,
        ),
      );
      setIsVoteStarted(false);
    } else {
      if (options.length >= 2) {
        setIsVoteStarted(true);
      }
    }
  };

  const handleVote = (option: Vote) => {
    setOptions(
      options.map((o) =>
        o.option === option.option ? { ...o, votes: o.votes + 1 } : o,
      ),
    );
    console.log(option.color);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-1/3">
        <DialogTitle>Create a Vote</DialogTitle>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Voting options
              </Typography>
              <Stack direction="row" spacing={2}>
                <Textarea
                  className="w-full focus-visible:ring-0"
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  placeholder="Enter a voting option"
                />
                <Button
                  variant="default"
                  className="cursor-pointer"
                  onClick={handleAddOption}
                  disabled={!newOption.trim()}
                >
                  <HiOutlinePlus />
                </Button>
              </Stack>
            </Box>

            {options.length > 0 && (
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Current Options:
                </Typography>
                <Stack spacing={1}>
                  {options.map((option, index) => (
                    <button
                      key={index}
                      className={`flex flex-col gap-0 rounded-md bg-gray-100 ${
                        isVoteStarted ? "cursor-pointer hover:bg-gray-200" : ""
                      }`}
                      onClick={() => isVoteStarted && handleVote(option)}
                    >
                      <div className="flex items-center justify-between p-3">
                        <span>{option.option}</span>
                        {!isVoteStarted && (
                          <Button
                            variant="outline"
                            className="cursor-pointer"
                            onClick={() => handleRemoveOption(index)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      {isVoteStarted && (
                        <Progress
                          value={getVotesPercentage(option)}
                          className={`[&>div]:${option.color}`}
                        />
                      )}
                    </button>
                  ))}
                </Stack>
              </Box>
            )}

            <Button
              type="submit"
              variant="default"
              disabled={options.length < 2}
              onClick={handleSubmitVote}
            >
              {isVoteStarted ? "Stop Vote" : "Start Vote"}
            </Button>
          </Stack>
        </Paper>
      </DialogContent>
    </Dialog>
  );
}
