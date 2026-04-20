import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Database, Settings } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function DatabasePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Database Tools</h1>
            <p className="text-slate-600">Manage your MySQL database and analyze model data</p>
          </div>
          <Button>
            <Settings className="h-4 w-4 mr-2" />
            Database Settings
          </Button>
        </div>

        {/* Connection Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Connection
            </CardTitle>
            <CardDescription>Current database configuration and connection status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="host">Host</Label>
                    <Input id="host" value="127.0.0.1:3307" readOnly />
                  </div>
                  <div>
                    <Label htmlFor="user">User</Label>
                    <Input id="user" value="root" readOnly />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" value="105585" readOnly />
                  </div>
                  <div>
                    <Label htmlFor="database">Database</Label>
                    <Input id="database" value="modelsraver1" readOnly />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="bg-green-100 text-green-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Database className="h-8 w-8" />
                  </div>
                  <div className="text-lg font-semibold text-green-600">Connected</div>
                  <div className="text-sm text-slate-600">Database connection active</div>
                  <Button className="mt-3 bg-transparent" variant="outline" size="sm">
                    Test Connection
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="tables" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tables">Tables</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="queries">Query Builder</TabsTrigger>
            <TabsTrigger value="backup">Backup & Restore</TabsTrigger>
          </TabsList>

          <TabsContent value="tables">
            <div className="grid gap-4">
              {[
                { name: "model_requests", rows: 1247, size: "2.3MB", description: "AI model request logs" },
                { name: "model_responses", rows: 1198, size: "5.1MB", description: "AI model response data" },
                { name: "user_sessions", rows: 89, size: "0.8MB", description: "User session tracking" },
                { name: "performance_metrics", rows: 2456, size: "1.2MB", description: "Model performance data" },
                { name: "webhook_logs", rows: 156, size: "0.3MB", description: "ElevenLabs webhook events" },
              ].map((table) => (
                <Card key={table.name}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{table.name}</h3>
                        <p className="text-sm text-slate-600">{table.description}</p>
                        <div className="flex gap-4 mt-2 text-xs text-slate-500">
                          <span>{table.rows.toLocaleString()} rows</span>
                          <span>{table.size}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          Export
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Database Statistics</CardTitle>
                  <CardDescription>Overview of database usage and performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">5</div>
                      <div className="text-sm text-slate-600">Tables</div>
                    </div>
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">5,146</div>
                      <div className="text-sm text-slate-600">Total Records</div>
                    </div>
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">9.7MB</div>
                      <div className="text-sm text-slate-600">Database Size</div>
                    </div>
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">98.5%</div>
                      <div className="text-sm text-slate-600">Uptime</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest database operations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { action: "INSERT", table: "model_requests", time: "2 minutes ago", user: "system" },
                      { action: "SELECT", table: "performance_metrics", time: "5 minutes ago", user: "admin" },
                      { action: "UPDATE", table: "user_sessions", time: "8 minutes ago", user: "system" },
                      { action: "INSERT", table: "webhook_logs", time: "12 minutes ago", user: "webhook" },
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{activity.action}</Badge>
                          <div>
                            <div className="font-medium text-sm">{activity.table}</div>
                            <div className="text-xs text-slate-600">
                              {activity.user} • {activity.time}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="queries">
            <Card>
              <CardHeader>
                <CardTitle>SQL Query Builder</CardTitle>
                <CardDescription>Build and execute custom SQL queries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="query">SQL Query</Label>
                    <textarea
                      id="query"
                      className="w-full h-32 p-3 border rounded-lg font-mono text-sm"
                      placeholder="SELECT * FROM model_requests WHERE model_name = 'mistral' ORDER BY created_at DESC LIMIT 10;"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button>Execute Query</Button>
                    <Button variant="outline">Save Query</Button>
                    <Button variant="outline">Load Template</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="backup">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Database Backup</CardTitle>
                  <CardDescription>Create and manage database backups</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div>
                        <div className="font-medium">Full Database Backup</div>
                        <div className="text-sm text-slate-600">Backup all tables and data</div>
                      </div>
                      <Button>Create Backup</Button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div>
                        <div className="font-medium">Model Data Only</div>
                        <div className="text-sm text-slate-600">Backup only model-related tables</div>
                      </div>
                      <Button variant="outline">Selective Backup</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Backups</CardTitle>
                  <CardDescription>Manage and restore from previous backups</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { name: "full_backup_2024_01_15.sql", size: "2.3MB", date: "2024-01-15 14:30" },
                      { name: "models_backup_2024_01_14.sql", size: "1.8MB", date: "2024-01-14 09:15" },
                      { name: "full_backup_2024_01_13.sql", size: "2.1MB", date: "2024-01-13 18:45" },
                    ].map((backup, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <div className="font-medium">{backup.name}</div>
                          <div className="text-sm text-slate-600">
                            {backup.date} • {backup.size}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            Download
                          </Button>
                          <Button variant="outline" size="sm">
                            Restore
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
