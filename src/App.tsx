import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sun, Moon } from "lucide-react"

// ===== CONFIGURAÇÃO DA ESCALA =====
const DIA_BASE = new Date("2026-01-01T00:00:00")

const TURNOS = ["A", "B", "C", "D"] as const
const OFFSETS: Record<string, number> = {
  A: 0,
  B: 2,
  C: 4,
  D: 6,
}

// ===== LÓGICA DA ESCALA =====
function getTurnoByDateTime(dateTime: Date) {
  const hora = dateTime.getHours()

  // Madrugada pertence ao dia anterior
  const dataEscala =
    hora < 7
      ? new Date(dateTime.getFullYear(), dateTime.getMonth(), dateTime.getDate() - 1)
      : new Date(dateTime.getFullYear(), dateTime.getMonth(), dateTime.getDate())

  const faixaIndice =
    hora >= 7 && hora < 15 ? 0 :
    hora >= 15 && hora < 23 ? 2 : 4

  const dias =
    Math.floor(
      (dataEscala.getTime() - DIA_BASE.getTime()) / (1000 * 60 * 60 * 24)
    ) % 8

  for (const turno of TURNOS) {
    const indiceTurno = (dias + OFFSETS[turno] + 8) % 8
    const indiceNormalizado = Math.floor(indiceTurno / 2) * 2

    if (indiceNormalizado === faixaIndice) {
      return turno
    }
  }

  return "—"
}

// ===== COMPONENTE =====
export default function App() {
  const [agora, setAgora] = useState(new Date())
  const [dataSelecionada, setDataSelecionada] = useState(() => {
    const hoje = new Date()
    return hoje.toISOString().split("T")[0]
  })

  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  )

  // Atualiza o horário atual
  useEffect(() => {
    const timer = setInterval(() => setAgora(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Controle do tema
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [dark])

  const turnoAtual = getTurnoByDateTime(agora)

  // Turnos do dia (usando horas representativas)
  const turnosDoDia: Record<string, string> = {}

  TURNOS.forEach((turno) => (turnosDoDia[turno] = "FOLGA"))

  const dataBase = new Date(`${dataSelecionada}T00:00:00`)

  const periodos = [
    { label: "07–15", hora: 8 },
    { label: "15–23", hora: 16 },
    { label: "23–07", hora: 2 },
  ]

  periodos.forEach(({ label, hora }) => {
    const dt = new Date(dataBase)
    dt.setHours(hora, 0, 0, 0)
    const turno = getTurnoByDateTime(dt)
    turnosDoDia[turno] = label
  })

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Escala de Turnos - Eucatex MDP</h1>
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
            <CardTitle>Selecione a data e descubra o turno que irá trabalhar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="date"
              value={dataSelecionada}
              onChange={(e) => setDataSelecionada(e.target.value)}
              className="max-w-xs"
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
