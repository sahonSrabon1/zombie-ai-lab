import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Globe, Plus, Settings, Search, RefreshCw, ExternalLink } from "lucide-react"

export default function WHMDomainsPage() {
  const domains = [
    {
      domain: "example.com",
      status: "active",
      ssl: "valid",
      expiry: "2024-12-15",
      account: "user1",
      ip: "192.168.1.100",
    },
    {
      domain: "test-site.com",
      status: "suspended",
      ssl: "expired",
      expiry: "2024-03-20",
      account: "user2",
      ip: "192.168.1.101",
    },
    {
      domain: "my-app.dev",
      status: "active",
      ssl: "valid",
      expiry: "2024-08-30",
      account: "user3",
      ip: "192.168.1.102",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "suspended":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getSSLColor = (ssl: string) => {
    switch (ssl) {
      case "valid":
        return "bg-green-100 text-green-800"
      case "expired":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">WHM Domain Management</h1>
            <p className="text-slate-600">Manage domains, SSL certificates, and hosting accounts</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Domain
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Domains</p>
                  <p className="text-2xl font-bold">24</p>
                </div>
                <Globe className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">18</p>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">SSL Valid</p>
                  <p className="text-2xl font-bold text-blue-600">20</p>
                </div>
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Expiring Soon</p>
                  <p className="text-2xl font-bold text-orange-600">3</p>
                </div>
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="domains" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="domains">Domains</TabsTrigger>
            <TabsTrigger value="ssl">SSL Certificates</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
            <TabsTrigger value="dns">DNS Management</TabsTrigger>
          </TabsList>

          <TabsContent value="domains">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Domain List</CardTitle>
                    <CardDescription>Manage all your hosted domains</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Input placeholder="Search domains..." className="w-64" />
                    <Button variant="outline" size="sm">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {domains.map((domain, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="bg-blue-100 text-blue-800 rounded-full w-10 h-10 flex items-center justify-center">
                          <Globe className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-medium">{domain.domain}</div>
                          <div className="text-sm text-slate-600">
                            Account: {domain.account} • IP: {domain.ip}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(domain.status)}>{domain.status}</Badge>
                        <Badge className={getSSLColor(domain.ssl)}>SSL: {domain.ssl}</Badge>
                        <span className="text-sm text-slate-600">Exp: {domain.expiry}</span>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ssl">
            <Card>
              <CardHeader>
                <CardTitle>SSL Certificate Management</CardTitle>
                <CardDescription>Monitor and manage SSL certificates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {domains.map((domain, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div>
                        <div className="font-medium">{domain.domain}</div>
                        <div className="text-sm text-slate-600">Expires: {domain.expiry}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getSSLColor(domain.ssl)}>{domain.ssl}</Badge>
                        <Button variant="outline" size="sm">
                          Renew SSL
                        </Button>
                        <Button variant="outline" size="sm">
                          View Certificate
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="accounts">
            <Card>
              <CardHeader>
                <CardTitle>Hosting Accounts</CardTitle>
                <CardDescription>Manage cPanel accounts and resources</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {["user1", "user2", "user3"].map((account, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div>
                        <div className="font-medium">{account}</div>
                        <div className="text-sm text-slate-600">Disk Usage: 2.3GB / 10GB • Bandwidth: 45GB / 100GB</div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Manage
                        </Button>
                        <Button variant="outline" size="sm">
                          Login to cPanel
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dns">
            <Card>
              <CardHeader>
                <CardTitle>DNS Management</CardTitle>
                <CardDescription>Configure DNS records and nameservers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {domains.map((domain, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div>
                        <div className="font-medium">{domain.domain}</div>
                        <div className="text-sm text-slate-600">
                          A Record: {domain.ip} • MX Record: mail.{domain.domain}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Edit DNS
                        </Button>
                        <Button variant="outline" size="sm">
                          Zone Editor
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
