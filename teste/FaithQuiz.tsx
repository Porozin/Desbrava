import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

const QUIZ_DATA = [
  // Desbravadores
  { question: "O que significa o triângulo invertido no emblema D1?", options: ["Pai, Filho e Espírito Santo", "Fisico, Mental e Espiritual", "Fé, Esperança e Amor"], answer: "Fisico, Mental e Espiritual" },
  { question: "Quem escreveu o Hino dos Desbravadores?", options: ["Henry Bergh", "Ismênia dos Santos", "John Hancock"], answer: "Henry Bergh" },
  { question: "Em que ano o clube de Desbravadores foi aceito oficialmente pela Associação Geral?", options: ["1950", "1946", "1960"], answer: "1950" },
  { question: "Qual a cor que representa o 'Clube de Desbravadores' no lenço?", options: ["Vermelho", "Amarelo", "Branco"], answer: "Amarelo" },
  { question: "O que o escudo no emblema representa?", options: ["Proteção", "Fé", "Verdade"], answer: "Proteção" },

  // Bíblia
  { question: "Quem liderou o povo de Israel após a morte de Moisés?", options: ["Arão", "Josué", "Calebe"], answer: "Josué" },
  { question: "Quantos livros tem o Novo Testamento?", options: ["27", "39", "66"], answer: "27" },
  { question: "Qual o livro mais curto da Bíblia?", options: ["2 João", "Judas", "Obadias"], answer: "2 João" },
  { question: "Qual o nome do primeiro livro da Bíblia?", options: ["Êxodo", "Gênesis", "Levítico"], answer: "Gênesis" },
  { question: "Quem foi o Rei mais sábio de Israel?", options: ["Davi", "Saul", "Salomão"], answer: "Salomão" },

  // Especialidades / Natureza
  { question: "Na especialidade de Nós, qual nó é usado para fazer uma volta que não corre?", options: ["Catau", "Lais de Guia", "Nó de Pescador"], answer: "Lais de Guia" },
  { question: "Qual dessas nuvens indica tempestade iminente?", options: ["Cirrus", "Cumulonimbus", "Stratus"], answer: "Cumulonimbus" },
  { question: "A bússola aponta para qual norte?", options: ["Norte Verdadeiro", "Norte Magnético", "Norte Geográfico"], answer: "Norte Magnético" },
  { question: "No código Morse, qual é o sinal para 'SOS'?", options: ["... --- ...", "--- ... ---", ".. -- .."], answer: "... --- ..." },

  // Geral RPG / Desbrava
  { question: "Qual o loop principal de Desbrava?", options: ["Pesca", "Mata-mata", "Explorar-Combater-Decidir"], answer: "Explorar-Combater-Decidir" },
];

export default function FaithQuiz({ onResult }: { onResult: (correct: boolean) => void }) {
  const [current, setCurrent] = useState(QUIZ_DATA[Math.floor(Math.random() * QUIZ_DATA.length)]);
  const [selected, setSelected] = useState<string | null>(null);
  const [status, setStatus] = useState<'pending' | 'success' | 'fail'>('pending');

  const handleSelect = (opt: string) => {
    if (status !== 'pending') return;
    setSelected(opt);
    const isCorrect = opt === current.answer;
    setStatus(isCorrect ? 'success' : 'fail');
    
    setTimeout(() => {
      onResult(isCorrect);
    }, 1500);
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-zinc-900 border border-amber-500/30 rounded-2xl shadow-2xl shadow-amber-500/10">
      <div className="space-y-1">
        <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Desafio de Fé</span>
        <h3 className="text-xl font-bold text-zinc-100">{current.question}</h3>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {current.options.map((opt) => (
          <button
            key={opt}
            onClick={() => handleSelect(opt)}
            className={`
              relative flex items-center justify-between p-4 rounded-xl border transition-all text-left
              ${status === 'pending' ? 'bg-zinc-800 border-zinc-700 hover:border-amber-500/50' : ''}
              ${selected === opt && status === 'success' ? 'bg-amber-500/20 border-green-500 text-green-400' : ''}
              ${selected === opt && status === 'fail' ? 'bg-red-500/20 border-red-500 text-red-500' : ''}
              ${selected !== opt && status !== 'pending' ? 'opacity-40 grayscale' : ''}
            `}
          >
            <span className="font-medium">{opt}</span>
            {selected === opt && status === 'success' && <Check className="w-5 h-5 text-green-500" />}
            {selected === opt && status === 'fail' && <X className="w-5 h-5 text-red-500" />}
          </button>
        ))}
      </div>
    </div>
  );
}
