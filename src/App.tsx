import { useEffect, useState } from "react";

type PlayState = "start" | "playing" | "end";

function App() {
  const [playState, setPlayState] = useState<PlayState>("start");
  const updatePlayStateToPlaying = () => setPlayState("playing");
  const updatePlayStateToEnd = () => setPlayState("end");
  const updatePlayStateToStart = () => {
    setPlayState("start");
    setPlayerResults([]);
  };
  const [playerResults, setPlayerResults] = useState<PlayerResults[]>([]);

  return (
    <>
      <main className="max-w-screen-lg mx-auto p-4">
        {playState === "start" && (
          <Start updatePlayStateToPlaying={updatePlayStateToPlaying} />
        )}
        {playState === "playing" && (
          <Playing
            setPlayerResults={setPlayerResults}
            updatePlayStateToStart={updatePlayStateToStart}
            updatePlayStateToEnd={updatePlayStateToEnd}
          />
        )}
        {playState === "end" && (
          <End
            playerResults={playerResults}
            updatePlayStateToStart={updatePlayStateToStart}
          />
        )}
      </main>
    </>
  );
}

function Start({
  updatePlayStateToPlaying,
}: {
  updatePlayStateToPlaying: () => void;
}) {
  return (
    <div className="text-center">
      <h1 className="text-xl">Trivia Game</h1>
      <button onClick={updatePlayStateToPlaying}>Start</button>
    </div>
  );
}

type QuestionResponce = {
  response_code: number;
  results: {
    question: string;
    correct_answer: string;
    incorrect_answers: string[];
  }[];
};

type Question = {
  question: string;
  options: string[];
  correctAnswer: string;
};

type PlayerResults = Question & {
  playerAnswer: string;
};

function Playing({
  setPlayerResults,
  updatePlayStateToEnd,
  updatePlayStateToStart,
}: {
  setPlayerResults: React.Dispatch<React.SetStateAction<PlayerResults[]>>;
  updatePlayStateToStart: () => void;
  updatePlayStateToEnd: () => void;
}) {
  const [questions, setQuestions] = useState<Question[] | null>(null);
  useEffect(() => {
    fetch("https://opentdb.com/api.php?amount=5")
      .then((res) => {
        return res.json();
      })
      .then((data: QuestionResponce) => {
        if (data.response_code !== 0) {
          return;
        }
        const res = data.results.map(
          ({ question, correct_answer, incorrect_answers }) => {
            const options = incorrect_answers;
            options.splice(randomIndex(options.length), 0, correct_answer);
            // Use dom parser to decode html entities
            const domParser = new DOMParser();
            const parsedQuestion = domParser.parseFromString(
              question,
              "text/html",
            ).documentElement.textContent as string;
            const parsedOptions = options.map((option) => {
              return domParser.parseFromString(option, "text/html")
                .documentElement.textContent as string;
            });
            return {
              question: parsedQuestion,
              correctAnswer: correct_answer,
              options: parsedOptions,
            };
          },
        );
        setQuestions(res);
      })
      .catch((err) => console.error(err));
  }, []);

  if (!questions) return <div>Loading...</div>;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!questions) return;
    // Example of using FormData to extract field values from a form
    // https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/formdata_event
    const formData = new FormData(e.currentTarget);
    const playerResults: PlayerResults[] = questions.map((question) => {
      return {
        ...question,
        playerAnswer: formData.get(question.question) as string,
      };
    });
    setPlayerResults(playerResults);
    updatePlayStateToEnd();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ul className="space-y-4">
        {questions.map(({ options, question }) => {
          return (
            <li key={question}>
              <h2 className="text-xl">{question}</h2>
              <ul>
                {options.map((choice) => {
                  return (
                    <label key={choice} className="block">
                      <input
                        key={choice}
                        type="radio"
                        value={choice}
                        name={question}
                        required
                      />
                      {choice}
                    </label>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ul>
      <button className="mr-2" onClick={updatePlayStateToStart}>
        Back to Start
      </button>
      <button>Submit</button>
    </form>
  );
}

function randomIndex(length: number) {
  return Math.floor(Math.random() * length);
}

function End({
  playerResults,
  updatePlayStateToStart,
}: {
  updatePlayStateToStart: () => void;
  playerResults: PlayerResults[];
}) {
  return (
    <div className="space-y-2">
      <h1 className="text-xl">Results</h1>
      <ul className="space-y-2">
        {playerResults.map((result) => {
          return (
            <li key={result.question} className="space-y-2">
              <h2 className="text-lg">{result.question}</h2>
              <ul>
                {result.options.map((option) => {
                  const isCorrect = option === result.correctAnswer;
                  const isPlayerAnswer = option === result.playerAnswer;
                  return (
                    <li key={option} className="flex gap-1">
                      <label
                        className={`${!isCorrect && isPlayerAnswer ? "bg-red-400" : ""} ${isCorrect ? "bg-green-400" : ""}`}
                      >
                        <input type="radio" disabled checked={isPlayerAnswer} />
                        {option}
                      </label>
                      {isCorrect && !isPlayerAnswer && (
                        <span>Correct Answer</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ul>
      <button onClick={updatePlayStateToStart}>Back to Start</button>
    </div>
  );
}

export default App;
