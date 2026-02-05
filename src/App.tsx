import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sun, Moon } from "lucide-react"
import { CICLO_84 } from "./database/ciclo-84"

// ================= CONFIGURAÇÃO =================
const DIA_BASE = new Date("2026-01-01T00:00:00")

const TURNOS = ["A", "B", "C", "D"] as const
type Turno = typeof TURNOS[number]

type Periodo = "manha" | "tarde" | "noite"

// ================= FUNÇÕES AUXILIARES =================
function diffDias(data: Date, base: Date) {
  const d1 = new Date(data.getFullYear(), data.getMonth(), data.getDate())
  const d2 = new Date(base.getFullYear(), base.getMonth(), base.getDate())
  return Math.floor((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24))
}

function getPeriodo(date: Date): Periodo {
  const h = date.getHours() + date.getMinutes() / 60

  if (h >= 7 && h < 15) return "manha"
  if (h >= 15 && h < 23) return "tarde"
  return "noite"
}

// ================= LÓGICA DA ESCALA =================
function getEscalaByDateTime(dateTime: Date) {
  const periodo = getPeriodo(dateTime)

  // Madrugada (00–06:59) pertence ao dia anterior
  const dataEscala =
    periodo === "noite" && dateTime.getHours() < 7
      ? new Date(
          dateTime.getFullYear(),
          dateTime.getMonth(),
          dateTime.getDate() - 1
        )
      : new Date(
          dateTime.getFullYear(),
          dateTime.getMonth(),
          dateTime.getDate()
        )

  const dias = diffDias(dataEscala, DIA_BASE)
  const indice = ((dias % 84) + 84) % 84

  const escalaDia = CICLO_84[indice]

  return {
    periodoAtual: periodo,
    turnoAtual: escalaDia[periodo] as Turno,
    periodos: escalaDia,
  }
}

// ================= COMPONENTE =================
export default function App() {
  const [agora, setAgora] = useState(new Date())
  const [dataSelecionada, setDataSelecionada] = useState(() => {
    const hoje = new Date()
    return hoje.toISOString().split("T")[0]
  })

  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  )

  // Atualiza horário atual
  useEffect(() => {
    const timer = setInterval(() => setAgora(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Controle de tema
  useEffect(() => {
    if (dark) document.documentElement.classList.add("dark")
    else document.documentElement.classList.remove("dark")
  }, [dark])

  const { turnoAtual } = getEscalaByDateTime(agora)

  // ===== Escala do dia selecionado =====
  const turnosDoDia: Record<Turno, string> = {
    A: "FOLGA",
    B: "FOLGA",
    C: "FOLGA",
    D: "FOLGA",
  }

  const dataBase = new Date(`${dataSelecionada}T12:00:00`)
  const escalaDia = getEscalaByDateTime(dataBase).periodos

  turnosDoDia[escalaDia.manha as Turno] = "07–15"
  turnosDoDia[escalaDia.tarde as Turno] = "15–23"
  turnosDoDia[escalaDia.noite as Turno] = "23–07"

  // ================= UI =================
  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            Escala de Turnos - Eucatex MDP
          </h1>
          <Button variant="outline" size="icon" onClick={() => setDark(!dark)}>
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
        </div>

        {/* TURNO ATUAL */}
        <Card>
          <CardHeader>
            <CardTitle>Turno no momento</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            Turno {turnoAtual}
            <div className="text-sm font-normal text-muted-foreground mt-1">
              {agora.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        {/* SELEÇÃO DE DATA */}
        <Card>
          <CardHeader>
            <CardTitle>
              Selecione a data e descubra o turno que irá trabalhar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="date"
              value={dataSelecionada}
              onChange={(e) => setDataSelecionada(e.target.value)}
              className="max-w-xs w-full"
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {TURNOS.map((turno) => (
                <Card key={turno} className="text-center">
                  <CardHeader>
                    <CardTitle>Turno {turno}</CardTitle>
                  </CardHeader>
                  <CardContent
                    className={
                      turnosDoDia[turno] === "FOLGA"
                        ? "text-muted-foreground"
                        : "font-semibold"
                    }
                  >
                    {turnosDoDia[turno]}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <footer className="max-w-5xl mx-auto mt-6 text-center text-sm text-muted-foreground">
        Desenvolvido por Luigi Fedele
      </footer>
    </div>
  )
}
