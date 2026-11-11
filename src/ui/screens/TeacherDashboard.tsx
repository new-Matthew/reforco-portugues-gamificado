import { useMemo, useState } from "react";
import type { Course, CourseSummary, MapNode } from "../../core/entities/index";
import {
  validateLessonDraft,
  validateQuestionDraft,
  type AuthoringIssue,
  type AuthoringResult,
  type CourseDraft,
  type LessonDraft,
  type QuestionDraft,
} from "../../core/services/authoring";
import { PixelButton } from "../pixel/PixelButton";
import { PixelPanel } from "../pixel/PixelPanel";
import { PixelSprite } from "../pixel/PixelSprite";
import {
  chestSprite,
  coinSprite,
  npcSprite,
  spriteForIcon,
  starSprite,
} from "../pixel/sprites";

const ICONS = [
  { value: "star", label: "Estrela", sprite: starSprite },
  { value: "chest", label: "Baú", sprite: chestSprite },
  { value: "npc", label: "Mestre", sprite: npcSprite },
  { value: "coin", label: "Moeda", sprite: coinSprite },
] as const;

const CHOICE_LETTERS = ["A", "B", "C", "D"] as const;

function emptyQuestion(): QuestionDraft {
  return {
    prompt: "",
    alternatives: ["", "", "", ""],
    correctIndex: 0,
    explanation: "",
  };
}

interface TeacherDashboardProps {
  readonly courses: readonly CourseSummary[];
  readonly activeCourseId: string | null;
  readonly nodes: readonly MapNode[];
  readonly onSelectCourse: (courseId: string) => void;
  readonly onCreateCourse: (draft: CourseDraft) => AuthoringResult<Course>;
  readonly onPublishLesson: (draft: LessonDraft) => AuthoringResult<MapNode>;
}

export function TeacherDashboard({
  courses,
  activeCourseId,
  nodes,
  onSelectCourse,
  onCreateCourse,
  onPublishLesson,
}: TeacherDashboardProps) {
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [chapter, setChapter] = useState("Módulo 01 · Turma");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState<string>("star");
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [question, setQuestion] = useState<QuestionDraft>(emptyQuestion);
  const [issues, setIssues] = useState<readonly AuthoringIssue[]>([]);
  const [success, setSuccess] = useState<string | null>(null);

  const activeCourse = courses.find((course) => course.id === activeCourseId);
  const chapters = useMemo(() => {
    const unique = new Set<string>();
    for (const node of nodes) {
      if (node.chapter) unique.add(node.chapter);
    }
    return [...unique];
  }, [nodes]);
  const questionCount = nodes.reduce(
    (total, node) => total + node.lesson.questions.length,
    0,
  );

  const clearFeedback = (): void => {
    setIssues([]);
    setSuccess(null);
  };

  const handleCreateCourse = (): void => {
    const result = onCreateCourse({
      title: courseTitle,
      description: courseDescription,
    });
    if (!result.ok) {
      setSuccess(null);
      setIssues(result.issues);
      return;
    }

    setCourseTitle("");
    setCourseDescription("");
    setShowCourseForm(false);
    setIssues([]);
    setSuccess(`Trilha "${result.value.title}" criada. Agora adicione a primeira lição.`);
  };

  const handleAddQuestion = (): void => {
    const validation = validateQuestionDraft(question);
    if (validation.length > 0) {
      setSuccess(null);
      setIssues(validation);
      return;
    }

    setQuestions((current) => [
      ...current,
      {
        prompt: question.prompt.trim(),
        alternatives: question.alternatives.map((item) => item.trim()),
        correctIndex: question.correctIndex,
        explanation: question.explanation.trim(),
      },
    ]);
    setQuestion(emptyQuestion());
    clearFeedback();
  };

  const handleRemoveQuestion = (index: number): void => {
    setQuestions((current) => current.filter((_, position) => position !== index));
  };

  const handlePublish = (): void => {
    const draft: LessonDraft = {
      chapter,
      title,
      description,
      icon,
      questions,
    };
    const validation = validateLessonDraft(draft);
    if (validation.length > 0) {
      setSuccess(null);
      setIssues(validation);
      return;
    }

    const result = onPublishLesson(draft);
    if (!result.ok) {
      setSuccess(null);
      setIssues(result.issues);
      return;
    }

    setIssues([]);
    setSuccess(
      `Lição "${result.value.title}" publicada! Já aparece na visão do aluno.`,
    );
    setTitle("");
    setDescription("");
    setQuestions([]);
    setQuestion(emptyQuestion());
  };

  return (
    <div className="screen teacher-screen">
      <header className="teacher-header">
        <div className="avatar-frame">
          <PixelSprite sprite={npcSprite} size={44} title="Professor" />
        </div>
        <div>
          <span className="eyebrow">Visão do professor</span>
          <h1>Painel de criação</h1>
        </div>
      </header>

      <div className="teacher-stats">
        <div className="teacher-stat">
          <span>Trilhas</span>
          <strong>{courses.length}</strong>
        </div>
        <div className="teacher-stat">
          <span>Lições</span>
          <strong>{nodes.length}</strong>
        </div>
        <div className="teacher-stat">
          <span>Questões</span>
          <strong>{questionCount}</strong>
        </div>
      </div>

      <section className="teacher-section">
        <div className="teacher-section__head">
          <h2>Trilhas da turma</h2>
          <PixelButton
            variant="ghost"
            onClick={() => {
              setShowCourseForm((current) => !current);
              clearFeedback();
            }}
          >
            {showCourseForm ? "Cancelar" : "+ Nova trilha"}
          </PixelButton>
        </div>

        {courses.length === 0 ? (
          <p className="empty-state">
            Nenhuma trilha criada ainda. Comece criando uma trilha para a turma.
          </p>
        ) : (
          <nav className="course-tabs" aria-label="Trilhas para edição">
            {courses.map((course) => (
              <button
                key={course.id}
                type="button"
                className="course-tab"
                aria-pressed={course.id === activeCourseId}
                onClick={() => {
                  clearFeedback();
                  onSelectCourse(course.id);
                }}
              >
                {course.title}
                <span>
                  {course.completedCount}/{course.nodeCount}
                </span>
              </button>
            ))}
          </nav>
        )}

        {showCourseForm ? (
          <PixelPanel className="form-panel">
            <div className="form-grid">
              <label className="field">
                <span className="field__label">Título da trilha</span>
                <input
                  className="pixel-input"
                  value={courseTitle}
                  maxLength={60}
                  placeholder="Ex.: Trilha da Turma 6º Ano"
                  onChange={(event) => setCourseTitle(event.target.value)}
                />
              </label>
              <label className="field">
                <span className="field__label">Descrição (opcional)</span>
                <textarea
                  className="pixel-input pixel-textarea"
                  value={courseDescription}
                  maxLength={180}
                  placeholder="Conteúdo que será trabalhado nesta trilha"
                  onChange={(event) => setCourseDescription(event.target.value)}
                />
              </label>
            </div>
            <PixelButton onClick={handleCreateCourse}>Criar trilha</PixelButton>
          </PixelPanel>
        ) : null}
      </section>

      <section className="teacher-section">
        <div className="teacher-section__head">
          <h2>Lições publicadas</h2>
          <span className="teacher-section__meta">
            {activeCourse?.title ?? "Nenhuma trilha selecionada"}
          </span>
        </div>

        {nodes.length === 0 ? (
          <p className="empty-state">
            Nenhuma lição nesta trilha. Use o construtor abaixo para publicar a
            primeira.
          </p>
        ) : (
          <ul className="lesson-list">
            {nodes.map((node) => (
              <li key={node.id}>
                <span className="lesson-list__icon">
                  <PixelSprite sprite={spriteForIcon(node.icon)} size={22} />
                </span>
                <div className="lesson-list__text">
                  <strong>{node.title}</strong>
                  <span>{node.chapter ?? "Sem módulo"}</span>
                </div>
                <span className="lesson-list__meta">
                  {node.lesson.questions.length}{" "}
                  {node.lesson.questions.length === 1 ? "questão" : "questões"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="teacher-section">
        <div className="teacher-section__head">
          <h2>Nova lição</h2>
          <span className="teacher-section__meta">Quiz de múltipla escolha</span>
        </div>

        {activeCourse ? (
          <PixelPanel className="form-panel">
            <div className="form-grid">
              <label className="field">
                <span className="field__label">Módulo</span>
                <input
                  className="pixel-input"
                  list="teacher-chapter-options"
                  value={chapter}
                  maxLength={60}
                  placeholder="Ex.: Módulo 01 · Termos essenciais"
                  onChange={(event) => setChapter(event.target.value)}
                />
                <datalist id="teacher-chapter-options">
                  {chapters.map((option) => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
              </label>

              <label className="field">
                <span className="field__label">Título da lição</span>
                <input
                  className="pixel-input"
                  value={title}
                  maxLength={70}
                  placeholder="Ex.: Sujeito oculto na prática"
                  onChange={(event) => setTitle(event.target.value)}
                />
              </label>

              <label className="field">
                <span className="field__label">Descrição</span>
                <textarea
                  className="pixel-input pixel-textarea"
                  value={description}
                  maxLength={180}
                  placeholder="O que o aluno vai aprender nesta lição?"
                  onChange={(event) => setDescription(event.target.value)}
                />
              </label>

              <fieldset className="field">
                <legend className="field__label">Ícone da lição</legend>
                <div className="icon-picker">
                  {ICONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className="icon-option"
                      aria-label={option.label}
                      aria-pressed={icon === option.value}
                      onClick={() => setIcon(option.value)}
                    >
                      <PixelSprite sprite={option.sprite} size={26} />
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>

            <fieldset className="quiz-question">
              <legend>Construtor de questão</legend>

              <label className="field">
                <span className="field__label">Pergunta</span>
                <textarea
                  className="pixel-input pixel-textarea"
                  value={question.prompt}
                  maxLength={220}
                  placeholder="Ex.: Qual é o sujeito da oração?"
                  onChange={(event) =>
                    setQuestion((current) => ({
                      ...current,
                      prompt: event.target.value,
                    }))
                  }
                />
              </label>

              <div className="field">
                <span className="field__label">
                  Alternativas (marque a correta)
                </span>
                <div className="alternatives">
                  {question.alternatives.map((alternative, index) => (
                    <div className="alternative-row" key={CHOICE_LETTERS[index]}>
                      <input
                        type="radio"
                        name="builder-correct-index"
                        aria-label={`Marcar alternativa ${CHOICE_LETTERS[index]} como correta`}
                        checked={question.correctIndex === index}
                        onChange={() =>
                          setQuestion((current) => ({
                            ...current,
                            correctIndex: index,
                          }))
                        }
                      />
                      <span className="alternative-row__letter">
                        {CHOICE_LETTERS[index]}
                      </span>
                      <input
                        className="pixel-input"
                        value={alternative}
                        maxLength={90}
                        placeholder={`Alternativa ${CHOICE_LETTERS[index]}`}
                        aria-label={`Alternativa ${CHOICE_LETTERS[index]}`}
                        onChange={(event) =>
                          setQuestion((current) => ({
                            ...current,
                            alternatives: current.alternatives.map(
                              (item, position) =>
                                position === index ? event.target.value : item,
                            ),
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              <label className="field">
                <span className="field__label">Explicação pedagógica</span>
                <textarea
                  className="pixel-input pixel-textarea"
                  value={question.explanation}
                  maxLength={220}
                  placeholder="Explique por que a alternativa correta está certa."
                  onChange={(event) =>
                    setQuestion((current) => ({
                      ...current,
                      explanation: event.target.value,
                    }))
                  }
                />
              </label>

              <PixelButton variant="secondary" onClick={handleAddQuestion}>
                + Adicionar questão
              </PixelButton>
            </fieldset>

            {questions.length > 0 ? (
              <ul className="question-bank">
                {questions.map((item, index) => (
                  <li key={`${index}-${item.prompt}`}>
                    <span className="question-bank__index">{index + 1}</span>
                    <div className="question-bank__text">
                      <strong>{item.prompt}</strong>
                      <span>
                        Correta:{" "}
                        {CHOICE_LETTERS[item.correctIndex] ?? "A"} ·{" "}
                        {item.alternatives.length} alternativas
                      </span>
                    </div>
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => handleRemoveQuestion(index)}
                    >
                      Remover
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-state">
                Nenhuma questão adicionada. O aluno verá apenas lições com pelo
                menos uma questão.
              </p>
            )}

            {issues.length > 0 ? (
              <div className="form-errors" role="alert">
                <strong>Revise antes de publicar:</strong>
                <ul>
                  {issues.map((issue, index) => (
                    <li key={`${issue.field}-${index}`}>{issue.message}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {success ? (
              <p className="form-success" role="status">
                {success}
              </p>
            ) : null}

            <PixelButton fullWidth onClick={handlePublish}>
              Publicar lição para os alunos
            </PixelButton>
          </PixelPanel>
        ) : (
          <p className="empty-state">
            Selecione ou crie uma trilha para começar a montar lições.
          </p>
        )}
      </section>
    </div>
  );
}
