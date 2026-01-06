"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DifficultyLevel, Question, QuestionType, DoubleSeriesData } from "@/lib/types";
import { storage } from "@/lib/storage";
import { Plus, X, Star, Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import { DoubleSeriesForm } from "@/components/double-series-form";

interface QuestionFormProps {
  onQuestionAdded?: () => void;
  editQuestion?: Question | null;
  onCancelEdit?: () => void;
}

export function QuestionForm({ onQuestionAdded, editQuestion, onCancelEdit }: QuestionFormProps) {
  const [questionType, setQuestionType] = useState<QuestionType>("standard");
  const [category, setCategory] = useState("");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [explanation, setExplanation] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("medium");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [doubleSeriesData, setDoubleSeriesData] = useState<DoubleSeriesData>({
    horizontalSeries: ["", "", "", "", ""],
    verticalSeries: ["", "", "", "", ""],
    horizontalLabel: "",
    verticalLabel: "",
  });

  // Load question data when editing
  useEffect(() => {
    if (editQuestion) {
      setQuestionType(editQuestion.questionType || "standard");
      setCategory(editQuestion.category);
      setQuestion(editQuestion.question);
      setOptions(editQuestion.options);
      setCorrectAnswer(editQuestion.correctAnswer);
      setExplanation(editQuestion.explanation || "");
      setDifficulty(editQuestion.difficulty || "medium");
      setTags(editQuestion.tags || []);
      setIsFavorite(editQuestion.isFavorite || false);
      setImageUrl(editQuestion.imageUrl || "");
      setImagePreview(editQuestion.imageUrl || "");
      if (editQuestion.doubleSeriesData) {
        setDoubleSeriesData(editQuestion.doubleSeriesData);
      }
    }
  }, [editQuestion]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner une image valide');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('L\'image ne doit pas dépasser 5 MB');
        return;
      }

      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview("");
    setImageUrl("");
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    setOptions([...options, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      if (correctAnswer >= index) {
        setCorrectAnswer(Math.max(0, correctAnswer - 1));
      }
    }
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validOptions = options.filter(opt => opt.trim() !== "");
    if (validOptions.length < 2) {
      alert("Veuillez ajouter au moins 2 options");
      return;
    }

    if (!category.trim() || !question.trim()) {
      alert("Veuillez remplir la catégorie et la question");
      return;
    }

    setIsUploading(true);

    try {
      // Upload image if a new file is selected
      let finalImageUrl = imageUrl;
      if (imageFile) {
        const uploadedUrl = await storage.uploadImage(imageFile);
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;

          // Delete old image if updating and had a previous image
          if (editQuestion?.imageUrl && editQuestion.imageUrl !== uploadedUrl) {
            await storage.deleteImage(editQuestion.imageUrl);
          }
        }
      }

      // Adjust correctAnswer index after filtering empty options
      let adjustedCorrectAnswer = correctAnswer;
      let countBeforeCorrect = 0;
      for (let i = 0; i < correctAnswer; i++) {
        if (options[i].trim() === "") {
          countBeforeCorrect++;
        }
      }
      adjustedCorrectAnswer = correctAnswer - countBeforeCorrect;

      if (editQuestion) {
        // Update existing question
        await storage.updateQuestion(editQuestion.id, {
          category: category.trim(),
          question: question.trim(),
          options: validOptions,
          correctAnswer: adjustedCorrectAnswer,
          explanation: explanation.trim() || undefined,
          difficulty,
          tags: tags.length > 0 ? tags : undefined,
          isFavorite,
          imageUrl: finalImageUrl || undefined,
          questionType,
          doubleSeriesData: questionType === "double-series" ? doubleSeriesData : undefined,
        });
      } else {
        // Add new question
        await storage.addQuestion({
          category: category.trim(),
          question: question.trim(),
          options: validOptions,
          correctAnswer: adjustedCorrectAnswer,
          explanation: explanation.trim() || undefined,
          difficulty,
          tags: tags.length > 0 ? tags : undefined,
          isFavorite,
          imageUrl: finalImageUrl || undefined,
          questionType,
          doubleSeriesData: questionType === "double-series" ? doubleSeriesData : undefined,
        });
      }
    } catch (error) {
      console.error("Error saving question:", error);
      alert("Erreur lors de l'enregistrement de la question");
      setIsUploading(false);
      return;
    }

    setIsUploading(false);

    // Reset form
    setQuestionType("standard");
    setCategory("");
    setQuestion("");
    setOptions(["", "", "", ""]);
    setCorrectAnswer(0);
    setExplanation("");
    setDifficulty("medium");
    setTags([]);
    setTagInput("");
    setIsFavorite(false);
    setImageUrl("");
    setImageFile(null);
    setImagePreview("");
    setDoubleSeriesData({
      horizontalSeries: ["", "", "", "", ""],
      verticalSeries: ["", "", "", "", ""],
      horizontalLabel: "",
      verticalLabel: "",
    });

    onQuestionAdded?.();
    onCancelEdit?.();
  };

  const handleCancel = () => {
    // Reset form
    setQuestionType("standard");
    setCategory("");
    setQuestion("");
    setOptions(["", "", "", ""]);
    setCorrectAnswer(0);
    setExplanation("");
    setDifficulty("medium");
    setTags([]);
    setTagInput("");
    setIsFavorite(false);
    setImageUrl("");
    setImageFile(null);
    setImagePreview("");
    setDoubleSeriesData({
      horizontalSeries: ["", "", "", "", ""],
      verticalSeries: ["", "", "", "", ""],
      horizontalLabel: "",
      verticalLabel: "",
    });
    onCancelEdit?.();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editQuestion ? "Modifier la question" : "Ajouter une question"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="questionType">Type de question</Label>
              <select
                id="questionType"
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value as QuestionType)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="standard">Standard</option>
                <option value="double-series">Série Double (Sous-test 6)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ex: Logique, Calcul..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulté</Label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="easy">Facile</option>
                <option value="medium">Moyen</option>
                <option value="hard">Difficile</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="question">Question</Label>
            <Textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Entrez votre question..."
              className="min-h-[100px]"
              required
            />
          </div>

          {questionType === "standard" && (
            <div className="space-y-2">
              <Label htmlFor="image">Image (optionnel)</Label>
              <div className="space-y-3">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Aperçu"
                      className="w-full h-48 object-contain border rounded-lg bg-muted"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Supprimer
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="image"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          <span className="font-semibold">Cliquez pour ajouter</span> ou glissez une image
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">PNG, JPG (max. 5MB)</p>
                      </div>
                      <input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}

          {questionType === "double-series" && (
            <DoubleSeriesForm value={doubleSeriesData} onChange={setDoubleSeriesData} />
          )}

          <div className="space-y-2">
            <Label>
              Options de réponse
              {questionType === "double-series" && (
                <span className="text-xs text-muted-foreground ml-2">
                  (Paires de valeurs : valeur horizontale et valeur verticale)
                </span>
              )}
            </Label>
            {options.map((option, index) => (
              <div key={index} className="flex gap-2 items-center">
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={correctAnswer === index}
                    onChange={() => setCorrectAnswer(index)}
                    className="w-4 h-4"
                  />
                  <Input
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={
                      questionType === "double-series"
                        ? `Ex: C et 13`
                        : `Option ${index + 1}`
                    }
                  />
                </div>
                {options.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOption(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addOption}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une option
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="explanation">Explication (optionnel)</Label>
            <Textarea
              id="explanation"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Expliquez pourquoi cette réponse est correcte..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (optionnel)</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Ajoutez des tags..."
              />
              <Button type="button" onClick={addTag} size="sm" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="favorite"
              checked={isFavorite}
              onChange={(e) => setIsFavorite(e.target.checked)}
              className="w-4 h-4"
            />
            <Label htmlFor="favorite" className="flex items-center gap-2 cursor-pointer">
              <Star className={`h-4 w-4 ${isFavorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
              Marquer comme favori
            </Label>
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                editQuestion ? "Modifier la question" : "Ajouter la question"
              )}
            </Button>
            {editQuestion && (
              <Button type="button" variant="outline" onClick={handleCancel} className="flex-1" disabled={isUploading}>
                Annuler
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
