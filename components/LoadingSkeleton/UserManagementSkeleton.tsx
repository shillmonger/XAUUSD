export default function UserManagementSkeleton() {
  return (
    <main className="flex-1 overflow-y-auto">
          {/* Header Skeleton */}
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="h-10 w-48 bg-muted rounded animate-pulse"></div>
              <div className="h-4 w-40 bg-muted rounded animate-pulse"></div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 md:flex-none">
                <div className="h-10 w-64 bg-muted rounded-xl animate-pulse"></div>
              </div>
              <div className="h-10 w-32 bg-muted rounded-xl animate-pulse"></div>
            </div>
          </div>

          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card p-4 md:p-5 md:py-4 rounded-2xl border border-border shadow-sm">
                <div className="w-10 h-10 bg-muted rounded-xl animate-pulse mb-3"></div>
                <div className="h-6 w-12 bg-muted rounded animate-pulse mb-2"></div>
                <div className="h-3 w-24 bg-muted rounded animate-pulse"></div>
              </div>
            ))}
          </div>

          {/* User Table Skeleton */}
          <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-muted text-muted-foreground text-[10px] uppercase tracking-widest font-bold">
                  <tr>
                    <th className="px-6 py-4">
                      <div className="h-3 w-16 bg-muted rounded animate-pulse"></div>
                    </th>
                    <th className="px-6 py-4 hidden md:table-cell">
                      <div className="h-3 w-16 bg-muted rounded animate-pulse"></div>
                    </th>
                    <th className="px-6 py-4">
                      <div className="h-3 w-16 bg-muted rounded animate-pulse"></div>
                    </th>
                    <th className="px-6 py-4 hidden sm:table-cell">
                      <div className="h-3 w-28 bg-muted rounded animate-pulse"></div>
                    </th>
                    <th className="px-6 py-4 text-right">
                      <div className="h-3 w-20 bg-muted rounded animate-pulse ml-auto"></div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {[...Array(20)].map((_, index) => (
                    <tr key={index} className="group hover:bg-muted/50 transition-colors">
                      {/* User Skeleton */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-muted rounded-lg animate-pulse"></div>
                          <div className="w-8 h-8 bg-muted rounded-full animate-pulse"></div>
                          <div className="flex flex-col gap-1">
                            <div className="h-3 w-24 bg-muted rounded animate-pulse"></div>
                            <div className="h-3 w-20 bg-muted rounded animate-pulse"></div>
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 bg-muted rounded animate-pulse"></div>
                              <div className="h-3 w-32 bg-muted rounded animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Joined Skeleton */}
                      <td className="px-6 py-4 hidden md:table-cell">
                        <div className="h-3 w-20 bg-muted rounded animate-pulse"></div>
                      </td>

                      {/* Status Skeleton */}
                      <td className="px-6 py-4">
                        <div className="h-6 w-16 bg-muted rounded-full animate-pulse"></div>
                      </td>

                      {/* Account Balance Skeleton */}
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <div className="flex items-center gap-1">
                          <div className="w-4 h-4 bg-muted rounded animate-pulse"></div>
                          <div className="h-3 w-20 bg-muted rounded animate-pulse"></div>
                        </div>
                      </td>

                      {/* Actions Skeleton */}
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <div className="w-10 h-10 bg-muted rounded-lg animate-pulse"></div>
                          <div className="w-10 h-10 bg-muted rounded-lg animate-pulse"></div>
                          <div className="w-10 h-10 bg-muted rounded-lg animate-pulse"></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
  );
}
